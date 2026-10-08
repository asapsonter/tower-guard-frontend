/**
 * Deterministic national CNII dataset.
 *
 * The same seed always produces the same incidents, units, cases and people;
 * only timestamps are anchored to `nowMs` so live incidents always look live.
 * This is demo data for the NSCDC command dashboard — not real persons.
 */
import {
  SLA_STAGES,
  type AreaCommand, type ArrivalEvidence, type CniiSnapshot, type Corridor, type CustodyEvent, type EvidenceItem,
  type EvidenceKind, type ExecutiveKpis, type Formation, type GeoPoint, type GraphEdge, type GraphNode, type Hotspot,
  type Incident, type IncidentStatus, type IncidentType, type InsiderReferral, type InvestigationCase, type ModusOperandi,
  type Officer, type Operator, type ProsecutionCase, type ProsecutionKpis, type ResponseRecord, type ResponseUnit,
  type RiskCell, type ScorecardRow, type Severity, type SlaStage, type StateCommand, type StolenAsset, type Suspect,
  type ThreatPrediction, type TimelineEvent, type UnitStatus, type Vehicle, type WorkOrderVisit, type Zone, type CaseStage,
} from "./types.js";
import { CORRIDORS, LOCALITIES, RECOVERY_MARKETS, STATES, distanceKm, offsetKm, routeBetween } from "./geo.js";

// ── Seeded randomness ─────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Musa", "Ibrahim", "Chinedu", "Emeka", "Tunde", "Ngozi", "Halima", "Aisha", "Blessing", "Yakubu", "Grace", "Abdullahi", "Femi", "Kelechi", "Usman", "Bola", "Ifeanyi", "Zainab", "Samuel", "Joy", "Sani", "Uche", "Hauwa", "Segun", "Nnamdi", "Fatima", "Bashir", "Chioma", "Danladi", "Kemi"];
const LAST = ["Abdullahi", "Okafor", "Eze", "Bakare", "Yusuf", "Danjuma", "Ade", "Bello", "Nwosu", "Garba", "Okon", "Adeyemi", "Ibrahim", "Obi", "Lawal", "Okoro", "Mohammed", "Afolabi", "Umar", "Nnaji", "Aliyu", "Ogunleye", "Suleiman", "Chukwu", "Balogun", "Shehu", "Effiong", "Adamu", "Onyeka", "Salisu"];
const RANKS = ["SC", "DSC", "ASC I", "ASC II", "CIC", "Inspector", "Asst. Inspector", "Corps Asst. I", "Corps Asst. II"];
const OPERATORS: Operator[] = ["MTN", "Airtel", "Glo", "9mobile", "IHS Towers", "American Tower"];
const VEHICLE_TYPES = ["Toyota Hilux (patrol)", "Toyota Hiace (troop)", "Ford Ranger (patrol)", "Mitsubishi L200 (patrol)", "Isuzu D-Max (patrol)"];

const TYPE_LABEL: Record<IncidentType, string> = {
  vandalism: "TELECOM VANDALISM",
  theft: "EQUIPMENT THEFT",
  armed_intrusion: "ARMED INTRUSION",
  cable_theft: "CABLE THEFT",
  battery_generator_theft: "BATTERY / GENERATOR THEFT",
  tower_sabotage: "TOWER SABOTAGE",
};

const TYPE_MODUS: Record<IncidentType, ModusOperandi[]> = {
  vandalism: ["fence_cutting", "gate_compromise", "cable_cutting"],
  theft: ["gate_compromise", "impersonation", "equipment_substitution", "solar_theft"],
  armed_intrusion: ["fence_cutting", "gate_compromise"],
  cable_theft: ["cable_cutting", "fence_cutting"],
  battery_generator_theft: ["battery_removal", "generator_theft", "diesel_siphoning", "insider_assisted"],
  tower_sabotage: ["cable_cutting", "insider_assisted", "fence_cutting"],
};

const EVIDENCE_IMAGES = ["/evidence/intruder-snapshot.jpg", "/evidence/evidence1.jpeg", "/evidence/cctv-feed-nigerian-mast.jpg", "/evidence/thermal-detection-feed.jpg", "/evidence/camera-feed.jpg"];

const UNITS_PER_STATE: Record<string, number> = { FCT: 8, Kaduna: 5, Lagos: 6, Rivers: 4, Kano: 4, Oyo: 3, Niger: 2, Enugu: 2, Delta: 2, Plateau: 2, Edo: 2, Ogun: 2, Anambra: 2, Kogi: 2, Nasarawa: 2 };

/** Incident weight per state for the historical dataset (higher = more incidents). */
const STATE_WEIGHT: Record<string, number> = { FCT: 9, Kaduna: 8, Lagos: 7, Rivers: 6, Kano: 5, Oyo: 4, Niger: 4, Delta: 3, Enugu: 3, Kogi: 3, Ogun: 3, Edo: 2, Anambra: 2, Plateau: 2, Nasarawa: 2, Abia: 2, Imo: 2, Katsina: 2 };

// ── Builder ───────────────────────────────────────────────────────────────

export function buildSnapshot(nowMs: number): CniiSnapshot {
  const rnd = mulberry32(20261007);
  const r = rnd;
  const int = (lo: number, hi: number) => Math.floor(lo + r() * (hi - lo + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
  const chance = (p: number) => r() < p;
  const isoAgo = (sec: number) => new Date(nowMs - sec * 1000).toISOString();
  const isoAt = (ms: number) => new Date(ms).toISOString();
  const hex = (n: number) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
  const personName = () => `${pick(FIRST)} ${pick(LAST)}`;
  const officer = (prefix: string, i: number, rank?: string): Officer => ({
    id: `${prefix}-O${i}`,
    name: personName(),
    rank: rank ?? pick(RANKS.slice(3)),
    serviceNumber: `NSCDC/${int(10, 24)}/${int(10000, 99999)}`,
  });
  const plate = (code: string) => `${code}-${int(100, 999)}${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}`;

  // ── Geography & formations ──────────────────────────────────────────
  const stateCommands: StateCommand[] = STATES.map((s) => {
    const id = `SC-${s.code}`;
    const locs = LOCALITIES[s.state] ?? [];
    const areaCommands: AreaCommand[] = s.areas.map((name, i) => {
      const loc = locs.find((l) => l.area === name);
      const location = loc ? { lat: loc.lat, lng: loc.lng } : offsetKm({ lat: s.lat, lng: s.lng }, (i - 1) * 9, (i % 2 ? 1 : -1) * 7);
      return { id: `AC-${s.code}-${i + 1}`, name: `${name} Area Command`, stateCommandId: id, location };
    });
    return { id, state: s.state, zone: s.zone, capital: s.capital, location: { lat: s.lat, lng: s.lng }, areaCommands };
  });
  const scByState = new Map(stateCommands.map((s) => [s.state, s]));
  const stateMeta = new Map(STATES.map((s) => [s.state, s]));

  const formations: Formation[] = [
    { id: "NHQ", name: "NSCDC National Headquarters, Sauka", kind: "national_hq", zone: "North-Central", state: "FCT", location: { lat: 8.9862, lng: 7.3611 } },
    { id: "ZC-A", name: "Zone A Command (Lagos)", kind: "zonal_command", zone: "South-West", state: "Lagos", location: { lat: 6.55, lng: 3.38 } },
    { id: "ZC-B", name: "Zone B Command (Kaduna)", kind: "zonal_command", zone: "North-West", state: "Kaduna", location: { lat: 10.53, lng: 7.44 } },
    { id: "ZC-C", name: "Zone C Command (Bauchi)", kind: "zonal_command", zone: "North-East", state: "Bauchi", location: { lat: 10.31, lng: 9.85 } },
    { id: "ZC-D", name: "Zone D Command (Minna)", kind: "zonal_command", zone: "North-Central", state: "Niger", location: { lat: 9.62, lng: 6.55 } },
    { id: "ZC-E", name: "Zone E Command (Owerri)", kind: "zonal_command", zone: "South-East", state: "Imo", location: { lat: 5.49, lng: 7.03 } },
    { id: "ZC-F", name: "Zone F Command (Port Harcourt)", kind: "zonal_command", zone: "South-South", state: "Rivers", location: { lat: 4.82, lng: 7.03 } },
    ...stateCommands.map((s): Formation => ({ id: s.id, name: `${s.state} State Command`, kind: "state_command", zone: s.zone, state: s.state, location: s.location })),
    ...stateCommands.flatMap((s) => s.areaCommands.map((a): Formation => ({ id: a.id, name: a.name, kind: "area_command", zone: s.zone, state: s.state, location: a.location }))),
  ];
  // Fixed CNII posts along corridors
  CORRIDORS.forEach((c, ci) =>
    c.path.slice(1, -1).forEach((p, pi) =>
      formations.push({ id: `POST-${ci}-${pi}`, name: `CNII Post ${c.name.split(" ")[0]} ${pi + 1}`, kind: "post", zone: "North-Central", state: "", location: p }),
    ),
  );

  // ── Response units ──────────────────────────────────────────────────
  const units: ResponseUnit[] = [];
  // Hand-placed FCT units so the smart-dispatch demo is reproducible
  const FCT_PLACEMENT: Record<string, GeoPoint> = {
    "ABJ-11": { lat: 9.0882, lng: 7.4934 },               // Maitama
    "ABJ-12": { lat: 9.1561, lng: 7.3222 },               // Kubwa (on site at 00872)
    "ABJ-13": { lat: 8.9425, lng: 7.0833 },               // Gwagwalada
    "ABJ-14": offsetKm({ lat: 8.9761, lng: 7.3711 }, 3.5, 3.5), // ~6.2 km by road from Lugbe
    "ABJ-15": { lat: 9.0089, lng: 7.5867 },               // Karu
    "ABJ-16": { lat: 9.0643, lng: 7.4237 },               // Jabi → en route Gwarinpa
    "ABJ-17": { lat: 8.8796, lng: 7.2276 },               // Kuje
    "ABJ-18": { lat: 9.1532, lng: 7.4296 },               // Dutse
  };
  for (const s of STATES) {
    const sc = scByState.get(s.state)!;
    const n = UNITS_PER_STATE[s.state] ?? 1;
    for (let i = 0; i < n; i++) {
      const callsign = `${s.code}-${11 + i}`;
      const ac = sc.areaCommands[i % sc.areaCommands.length];
      const location = FCT_PLACEMENT[callsign] ?? offsetKm(ac.location, (r() - 0.5) * 10, (r() - 0.5) * 10);
      const crew = int(3, 5);
      const equipment = [
        { item: "Body-worn camera", ok: chance(0.9) },
        { item: "Radio (DMR)", ok: chance(0.93) },
        { item: "GPS tracker", ok: chance(0.95) },
        { item: "Bolt cutter kit", ok: chance(0.85) },
        { item: "First-aid kit", ok: chance(0.9) },
        { item: "Ballistic vests", ok: chance(0.88) },
      ];
      const readiness = Math.round((equipment.filter((e) => e.ok).length / equipment.length) * 100);
      units.push({
        id: callsign,
        callsign: `NSCDC Team ${callsign}`,
        stateCommandId: sc.id,
        areaCommandId: ac.id,
        state: s.state,
        zone: s.zone,
        commander: officer(callsign, 0, pick(["SC", "DSC", "ASC I"])),
        officers: Array.from({ length: crew }, (_, k) => officer(callsign, k + 1)),
        vehicle: { plate: plate(s.code), type: pick(VEHICLE_TYPES) },
        status: pick<UnitStatus>(["available", "available", "available", "standby", "standby", "returning", "unavailable"]),
        location,
        currentAssignment: null,
        equipmentReadiness: readiness,
        equipment,
        comms: chance(0.88) ? "online" : chance(0.6) ? "degraded" : "offline",
        armed: chance(0.55),
        lastCheckIn: isoAgo(int(20, 900)),
      });
    }
  }
  const unitById = new Map(units.map((u) => [u.id, u]));
  // Make the dispatch-demo units dependable
  Object.assign(unitById.get("ABJ-14")!, { status: "available", armed: true, comms: "online", equipmentReadiness: 100, equipment: unitById.get("ABJ-14")!.equipment.map((e) => ({ ...e, ok: true })) });
  for (const id of ["ABJ-11", "ABJ-15", "ABJ-17"]) Object.assign(unitById.get(id)!, { status: "standby" });
  Object.assign(unitById.get("ABJ-13")!, { status: "unavailable" });
  Object.assign(unitById.get("ABJ-18")!, { status: "returning" });

  // ── Suspects & vehicles ──────────────────────────────────────────────
  const suspects: Suspect[] = [];
  const vehicles: Vehicle[] = [];
  const addSuspect = (s: Omit<Suspect, "id">) => { const id = `SUS-${String(suspects.length + 1).padStart(4, "0")}`; suspects.push({ id, ...s }); return id; };
  const addVehicle = (v: Omit<Vehicle, "id">) => { const id = `VEH-${String(vehicles.length + 1).padStart(4, "0")}`; vehicles.push({ id, ...v }); return id; };

  // Curated cross-operator network (the "Kubwa–Dei-Dei network")
  const SUS_SCORPION = addSuspect({ alias: "Scorpion", name: "Danladi Musa Garba", status: "arrested", description: "Male, ~30s, scar on left forearm. Leads cable-cutting crew.", armed: false });
  const SUS_BABA = addSuspect({ alias: "Baba Cable", name: "Sani Aliyu", status: "wanted", description: "Male, 40s. Suspected buyer/transporter to Dei-Dei scrap dealers.", armed: false });
  const SUS_SMALL = addSuspect({ alias: "Small", name: null, status: "unidentified", description: "Male, slim, red cap. Seen at three sites on CCTV.", armed: false });
  const SUS_TECH = addSuspect({ alias: "—", name: "Emeka Onyeka", status: "identified", description: "Field technician (Apex Telecoms Services Ltd). Subject of insider-risk referral — not a suspect in law.", armed: false });
  const SUS_GUNMAN = addSuspect({ alias: "Kaftan", name: null, status: "unidentified", description: "Male, tall, carried what appeared to be a pump-action shotgun.", armed: true });
  const VEH_HIACE = addVehicle({ plate: "KUJ-482XA", description: "White Toyota Hiace, rear window cracked", seenAt: [] });
  const VEH_KEKE = addVehicle({ plate: null, description: "Yellow tricycle (keke), unregistered", seenAt: [] });
  const VEH_APEX = addVehicle({ plate: "ABC-219KS", description: "Silver Toyota Corolla, Apex Telecoms contractor sticker", seenAt: [] });
  for (let i = 0; i < 40; i++) {
    const identified = chance(0.55);
    addSuspect({
      alias: pick(["Oga", "Dogo", "Black", "Shortman", "Alhaji", "Ijaw", "Spark", "Wire", "Jigga", "Lion", "Bobo", "Kano boy"]),
      name: identified ? personName() : null,
      status: identified ? pick(["identified", "wanted", "arrested", "arrested", "charged", "released"]) : "unidentified",
      description: pick(["Male, 20s, slim build", "Male, 30s, medium build, beard", "Male, 40s, heavy build", "Male, 20s, tall, dreadlocks", "Female, 30s, seen as lookout"]),
      armed: chance(0.15),
    });
  }
  for (let i = 0; i < 22; i++) {
    addVehicle({
      plate: chance(0.7) ? plate(pick(["ABJ", "KAD", "LAG", "KUJ", "BWR", "PHC", "KAN"])) : null,
      description: pick(["Grey Toyota Sienna", "Blue Volkswagen Golf", "White Nissan pickup", "Black Honda Accord", "Red Bajaj motorcycle", "Green Mazda 323", "Unmarked flatbed truck"]),
      seenAt: [],
    });
  }

  // ── Incidents ────────────────────────────────────────────────────────
  const incidents: Incident[] = [];
  let incSeq = 700;
  // Hand-written featured incidents; the auto-numbering must never reuse these
  const RESERVED_INCIDENT_IDS = new Set(["INC-2026-00872", "INC-2026-00879", "INC-2026-00880", "INC-2026-00881", "INC-2026-00882", "INC-2026-00883", "INC-2026-00884"]);

  const slaFor = (state: string) => (state === "FCT" || state === "Lagos" ? 900 : 1200);

  interface IncidentSpec {
    id?: string;
    state: string;
    locality?: string;
    type: IncidentType;
    severity: Severity;
    status: IncidentStatus;
    detectedSecAgo: number;
    operator?: Operator;
    unitId?: string;
    persons?: number;
    weapon?: boolean;
    arrests?: number;
    recovered?: number;
    suspectIds?: string[];
    vehicleIds?: string[];
    timeline?: TimelineEvent[];
    claimedLate?: boolean;
    title?: string;
  }

  const siteFor = (state: string, locality?: string) => {
    const meta = stateMeta.get(state)!;
    const locs = LOCALITIES[state];
    const loc = locs ? (locality ? locs.find((l) => l.name === locality)! : pick(locs)) : null;
    const base = loc ? { lat: loc.lat, lng: loc.lng } : offsetKm({ lat: meta.lat, lng: meta.lng }, (r() - 0.5) * 30, (r() - 0.5) * 30);
    const location = offsetKm(base, (r() - 0.5) * 1.2, (r() - 0.5) * 1.2);
    const sc = scByState.get(state)!;
    const ac = loc ? sc.areaCommands.find((a) => a.name.startsWith(loc.area)) ?? sc.areaCommands[0] : pick(sc.areaCommands);
    return { location, localityName: loc?.name ?? `${meta.capital} outskirts`, ac, lga: loc?.area ?? meta.areas[0] };
  };

  const makeIncident = (spec: IncidentSpec): Incident => {
    const meta = stateMeta.get(spec.state)!;
    const sc = scByState.get(spec.state)!;
    const site = siteFor(spec.state, spec.locality);
    const operator = spec.operator ?? pick(OPERATORS);
    let id = spec.id;
    if (!id) {
      do id = `INC-2026-${String(++incSeq).padStart(5, "0")}`; while (RESERVED_INCIDENT_IDS.has(id));
    }
    const siteId = `${operator.replace(/\s/g, "").toUpperCase().slice(0, 3)}-${meta.code}-${int(1000, 9999)}`;
    const detected = nowMs - spec.detectedSecAgo * 1000;
    const sla = slaFor(spec.state);
    const persons = spec.persons ?? int(1, 4);
    const weapon = spec.weapon ?? (spec.type === "armed_intrusion" || chance(0.12));

    // Stage timeline (seconds after alert) — typical then perturbed
    const offsets: Record<SlaStage, number> = {
      alert: 0,
      verification: int(4, 25),
      dispatch: int(20, 75),
      acceptance: int(35, 140),
      departure: int(120, 300),
      en_route: int(130, 320),
      arrival: chance(0.08) ? int(960, 1900) : int(380, 860),
      intervention: int(500, 1800),
      closure: int(1800, 7200),
    };
    offsets.en_route = Math.max(offsets.en_route, offsets.departure + 5);
    offsets.arrival = Math.max(offsets.arrival, offsets.en_route + 240);
    offsets.intervention = offsets.arrival + int(120, 900);
    offsets.closure = Math.max(offsets.closure, offsets.intervention + 600);
    // Claimed-vs-verified discrepancy: the unit under-reports its arrival time
    const claimGapSec = spec.claimedLate ? int(11, 22) * 60 : 0;
    if (spec.claimedLate) {
      offsets.arrival = Math.max(offsets.arrival, int(1500, 2300));
      offsets.intervention = offsets.arrival + int(120, 900);
      offsets.closure = Math.max(offsets.closure, offsets.intervention + 600);
    }

    const reached: Record<IncidentStatus, SlaStage> = {
      detected: "alert", verified: "verification", dispatched: "acceptance", en_route: "en_route",
      on_site: "intervention", contained: "intervention", closed: "closure",
    };
    const lastIdx = SLA_STAGES.indexOf(reached[spec.status]);
    const elapsed = spec.detectedSecAgo;
    const stages: Partial<Record<SlaStage, string>> = {};
    SLA_STAGES.forEach((st, i) => {
      if (i <= lastIdx && offsets[st] <= elapsed) stages[st] = isoAt(detected + offsets[st] * 1000);
    });
    if (spec.status === "on_site" && !stages.arrival) {
      offsets.arrival = Math.max(60, elapsed - int(60, 240));
      stages.arrival = isoAt(detected + offsets.arrival * 1000);
    }

    const arrivalEvidence: ArrivalEvidence[] = stages.arrival
      ? (["gps_geofence", "digital_checkin", "access_record", "cctv_confirmation"] as ArrivalEvidence[]).filter((_, i) => i === 0 || chance(0.55))
      : [];
    let claimedArrival: string | undefined;
    let breachReason: string | undefined;
    const arrivalSec = stages.arrival ? offsets.arrival : null;
    if (stages.arrival && spec.claimedLate) {
      claimedArrival = isoAt(detected + (offsets.arrival - claimGapSec) * 1000);
    }
    const breached = arrivalSec !== null ? arrivalSec > sla : elapsed > sla && lastIdx < SLA_STAGES.indexOf("arrival");
    if (breached) {
      breachReason = spec.claimedLate
        ? `Unit-reported arrival not supported by GPS geofence (independent arrival ${Math.round(claimGapSec / 60)} min later)`
        : pick(["Traffic congestion on approach road", "Unit diverted from prior assignment", "Late acknowledgement by team commander", "Vehicle fault during turnout", "Flooded access road", "Awaiting armed support before approach"]);
    }

    const response: ResponseRecord = {
      slaSeconds: sla,
      stages,
      claimedArrival,
      verifiedArrival: stages.arrival,
      arrivalEvidence,
      breached,
      breachReason,
      distanceKm: Math.round((2 + r() * 14) * 10) / 10,
    };

    const timeline: TimelineEvent[] = spec.timeline ?? (() => {
      const ev: TimelineEvent[] = [{ at: isoAt(detected), source: pick(["radar", "camera", "sensor"]), label: pick(["Radar detects human movement", "Fence vibration sensor triggered", "Camera motion alarm", "Shelter door contact opened"]) }];
      if (stages.verification) ev.push({ at: stages.verification, source: "ai", label: `AI confidence ${int(82, 98)}% — ${persons} person${persons > 1 ? "s" : ""}` });
      if (stages.dispatch) ev.push({ at: stages.dispatch, source: "command", label: "NSCDC dispatch initiated" });
      if (stages.acceptance) ev.push({ at: stages.acceptance, source: "unit", label: "Team acknowledges" });
      if (stages.en_route) ev.push({ at: stages.en_route, source: "gps", label: "Unit departed — GPS track active" });
      if (stages.arrival) ev.push({ at: stages.arrival, source: "gps", label: "Team arrives — geofence confirmed" });
      if (stages.intervention) ev.push({ at: stages.intervention, source: "unit", label: (spec.arrests ?? 0) > 0 ? "Suspect apprehended" : "Site secured — suspects fled" });
      if (stages.closure) ev.push({ at: stages.closure, source: "command", label: "Incident closed — handed to investigation" });
      return ev;
    })();

    const titleLoc = `${site.localityName}, ${spec.state === "FCT" ? "Abuja" : spec.state}`;
    const active = spec.status !== "closed";
    return {
      id,
      type: spec.type,
      title: spec.title ?? `${active ? "ACTIVE " : ""}${TYPE_LABEL[spec.type]}`,
      severity: spec.severity,
      threatLevel: spec.severity === "critical" ? "CRITICAL" : spec.severity === "high" ? "HIGH" : spec.severity === "medium" ? "ELEVATED" : "GUARDED",
      status: spec.status,
      verified: spec.status !== "detected",
      operator,
      siteId,
      siteName: `${operator} ${site.localityName} Site`,
      location: site.location,
      state: spec.state,
      zone: meta.zone,
      stateCommandId: sc.id,
      areaCommandId: site.ac.id,
      lga: site.lga,
      detectedAt: isoAt(detected),
      modusOperandi: [pick(TYPE_MODUS[spec.type]), ...(chance(0.4) ? [pick(TYPE_MODUS[spec.type])] : [])].filter((v, i, a) => a.indexOf(v) === i),
      threatSummary: `${persons} person${persons > 1 ? "s" : ""}${weapon ? " / possible weapon" : ""} — ${titleLoc}`,
      personsDetected: persons,
      weaponSuspected: weapon,
      sensorAlerts: [
        { sensor: "Perimeter radar", reading: `${persons} track${persons > 1 ? "s" : ""}, 38 m`, at: isoAt(detected) },
        ...(chance(0.7) ? [{ sensor: "Fence vibration", reading: `${(1.5 + r() * 2).toFixed(1)}g peak`, at: isoAt(detected + 6000) }] : []),
        ...(chance(0.5) ? [{ sensor: "Shelter door", reading: "OPEN", at: isoAt(detected + 40000) }] : []),
        ...(spec.type === "battery_generator_theft" ? [{ sensor: "Battery bank", reading: `${int(2, 8)} modules offline`, at: isoAt(detected + 90000) }] : []),
      ],
      stillImages: [pick(EVIDENCE_IMAGES), pick(EVIDENCE_IMAGES)].filter((v, i, a) => a.indexOf(v) === i),
      videoFeedApproved: chance(0.8),
      suspectIds: spec.suspectIds ?? [],
      vehicleIds: spec.vehicleIds ?? [],
      respondingUnitId: spec.unitId ?? null,
      etaSeconds: null,
      route: [],
      timeline,
      response,
      arrests: spec.arrests ?? 0,
      assetsRecoveredNaira: spec.recovered ?? 0,
      caseId: null,
    };
  };

  // Featured incident from the brief — timeline offsets are exact
  const T0 = nowMs - (13 * 60 + 52) * 1000;
  const t = (sec: number) => isoAt(T0 + sec * 1000);
  const inc872 = makeIncident({
    id: "INC-2026-00872", state: "FCT", locality: "Kubwa", type: "vandalism", severity: "critical", status: "on_site",
    detectedSecAgo: 13 * 60 + 52, operator: "MTN", unitId: "ABJ-12", persons: 3, weapon: false, arrests: 1, recovered: 2_350_000,
    suspectIds: [SUS_SCORPION, SUS_SMALL, SUS_BABA], vehicleIds: [VEH_HIACE],
    title: "ACTIVE TELECOM VANDALISM",
    timeline: [
      { at: t(0), source: "radar", label: "Radar detects human movement", detail: "3 tracks, 41 m west of fence" },
      { at: t(2), source: "camera", label: "Camera confirms person", detail: "CAM-ABJ-0042 (Camera 02)" },
      { at: t(6), source: "sensor", label: "Fence vibration", detail: "Zone 3, 2.8g peak" },
      { at: t(11), source: "ai", label: "AI confidence 94%", detail: "3 persons, cutting tool detected" },
      { at: t(15), source: "command", label: "CIP declared", detail: "Critical Infrastructure Protection incident" },
      { at: t(17), source: "command", label: "NSCDC dispatch initiated", detail: "ABJ-12 assigned by Duty Officer" },
      { at: t(28), source: "unit", label: "Team acknowledges", detail: "ABJ-12 commander via DMR" },
      { at: t(523), source: "gps", label: "Team arrives", detail: "GPS geofence + CCTV confirmation" },
      { at: t(787), source: "unit", label: "Suspect apprehended", detail: "1 in custody, 2 fled on foot toward Dei-Dei" },
    ],
  });
  inc872.response.stages = { alert: t(0), verification: t(11), dispatch: t(17), acceptance: t(28), departure: t(95), en_route: t(98), arrival: t(523), intervention: t(787) };
  inc872.response.verifiedArrival = t(523);
  inc872.response.arrivalEvidence = ["gps_geofence", "cctv_confirmation"];
  inc872.response.breached = false;
  inc872.response.breachReason = undefined;
  inc872.response.distanceKm = 5.4;
  inc872.siteName = "MTN Kubwa Phase 4 Site";
  inc872.siteId = "MTN-ABJ-4417";
  inc872.modusOperandi = ["fence_cutting", "cable_cutting"];
  inc872.caseId = "NSCDC-CNII-2026-00428";
  inc872.videoFeedApproved = true;
  inc872.stillImages = ["/evidence/intruder-snapshot.jpg", "/evidence/cctv-feed-nigerian-mast.jpg"];
  incidents.push(inc872);

  incidents.push(makeIncident({ id: "INC-2026-00881", state: "FCT", locality: "Gwarinpa", type: "armed_intrusion", severity: "critical", status: "en_route", detectedSecAgo: 6 * 60 + 18, operator: "Airtel", unitId: "ABJ-16", persons: 2, weapon: true, suspectIds: [SUS_GUNMAN] }));
  incidents.push(makeIncident({ id: "INC-2026-00884", state: "FCT", locality: "Lugbe", type: "battery_generator_theft", severity: "critical", status: "verified", detectedSecAgo: 74, operator: "IHS Towers", persons: 3, weapon: true }));
  incidents.push(makeIncident({ id: "INC-2026-00879", state: "Kaduna", locality: "Kateri (Abuja–Kaduna Hwy)", type: "cable_theft", severity: "high", status: "on_site", detectedSecAgo: 38 * 60, unitId: "KAD-14", persons: 4, claimedLate: true }));
  incidents.push(makeIncident({ id: "INC-2026-00883", state: "Kaduna", locality: "Kawo", type: "battery_generator_theft", severity: "critical", status: "dispatched", detectedSecAgo: 3 * 60, unitId: "KAD-11", persons: 2 }));
  incidents.push(makeIncident({ id: "INC-2026-00880", state: "Lagos", locality: "Ikotun", type: "tower_sabotage", severity: "critical", status: "on_site", detectedSecAgo: 22 * 60, unitId: "LAG-13", persons: 2, arrests: 2, recovered: 1_800_000 }));
  incidents.push(makeIncident({ id: "INC-2026-00882", state: "Rivers", locality: "Oyigbo", type: "armed_intrusion", severity: "critical", status: "en_route", detectedSecAgo: 9 * 60, unitId: "PHC-12", persons: 3, weapon: true }));

  // Remaining active incidents: fill to 27 with the target status mix
  const activeMix: IncidentStatus[] = [
    "detected", "detected", "detected", "verified", "verified",
    "dispatched", "dispatched", "dispatched", "dispatched",
    "en_route", "en_route",
    "on_site", "on_site", "on_site", "on_site", "on_site", "on_site",
    "contained", "contained", "contained",
  ];
  const activeStates = ["FCT", "Kaduna", "Lagos", "Rivers", "Kano", "Oyo", "Niger", "Enugu", "Delta", "Ogun", "Kogi", "Plateau", "Edo", "Anambra", "Kaduna", "Lagos", "FCT", "Nasarawa", "Kano", "Rivers"];
  activeMix.forEach((status, i) => {
    const type = pick<IncidentType>(["vandalism", "theft", "cable_theft", "battery_generator_theft", "battery_generator_theft", "cable_theft", "tower_sabotage", "armed_intrusion"]);
    const sev: Severity = type === "armed_intrusion" ? "high" : pick(["high", "medium", "medium", "low", "high"]);
    const secAgo = status === "detected" ? int(20, 120) : status === "verified" ? int(60, 240) : status === "dispatched" ? int(120, 420) : status === "en_route" ? int(300, 900) : int(900, 5400);
    incidents.push(makeIncident({ state: activeStates[i], type, severity: sev, status, detectedSecAgo: secAgo, arrests: status === "contained" ? int(0, 2) : 0, recovered: status === "contained" && chance(0.6) ? int(4, 40) * 100_000 : 0 }));
  });
  // One more critical so the count lands at six
  incidents.push(makeIncident({ state: "Kano", locality: "Kano–Katsina Rd", type: "cable_theft", severity: "critical", status: "dispatched", detectedSecAgo: 4 * 60, persons: 5 }));

  // Historical (closed) incidents — 90 days, weighted by state
  const weighted = STATES.flatMap((s) => Array(STATE_WEIGHT[s.state] ?? 1).fill(s.state) as string[]);
  // Cross-operator pattern: MTN → Airtel → IHS within one week, same crew
  const DAY = 86400;
  const crossOps: IncidentSpec[] = [
    { state: "FCT", locality: "Kubwa", type: "cable_theft", severity: "high", status: "closed", detectedSecAgo: 9 * DAY + 2 * 3600, operator: "MTN", suspectIds: [SUS_SCORPION, SUS_SMALL], vehicleIds: [VEH_HIACE], recovered: 950_000 },
    { state: "FCT", locality: "Dutse Alhaji", type: "cable_theft", severity: "high", status: "closed", detectedSecAgo: 6 * DAY + 3 * 3600, operator: "Airtel", suspectIds: [SUS_SMALL, SUS_BABA], vehicleIds: [VEH_HIACE, VEH_KEKE] },
    { state: "FCT", locality: "Zuba", type: "battery_generator_theft", severity: "critical", status: "closed", detectedSecAgo: 4 * DAY + 1 * 3600, operator: "IHS Towers", suspectIds: [SUS_SCORPION, SUS_BABA], vehicleIds: [VEH_KEKE], arrests: 0 },
  ];
  const crossIds: string[] = [];
  for (const spec of crossOps) { const inc = makeIncident(spec); crossIds.push(inc.id); incidents.push(inc); }
  // Insider pattern: four Apex-visited sites vandalised within 48h of visits
  const apexIds: string[] = [];
  for (const [loc, days] of [["Maitama", 21], ["Jabi", 17], ["Karu", 12], ["Gwarinpa", 8]] as const) {
    const inc = makeIncident({ state: "FCT", locality: loc, type: "battery_generator_theft", severity: "high", status: "closed", detectedSecAgo: days * DAY, operator: pick(["MTN", "IHS Towers", "Glo"]), recovered: chance(0.5) ? 1_200_000 : 0 });
    inc.modusOperandi = ["battery_removal", "insider_assisted"];
    apexIds.push(inc.id);
    incidents.push(inc);
  }
  // Generic suspects/vehicles are each tied to a single incident so that
  // cross-operator links only come from the deliberate networks above
  let genericSuspect = suspects.findIndex((x) => x.id === SUS_GUNMAN) + 1;
  let genericVehicle = vehicles.findIndex((x) => x.id === VEH_APEX) + 1;
  for (let i = 0; i < 260; i++) {
    const state = pick(weighted);
    const type = pick<IncidentType>(["vandalism", "theft", "cable_theft", "cable_theft", "battery_generator_theft", "battery_generator_theft", "battery_generator_theft", "tower_sabotage", "armed_intrusion"]);
    // Night-heavy distribution of detection time
    const daysAgo = int(0, 89);
    const hour = chance(0.72) ? pick([0, 1, 2, 3, 4, 22, 23]) : int(5, 21);
    const now = new Date(nowMs);
    const when = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, hour - 1, int(0, 59), int(0, 59));
    const secAgo = Math.max(6 * 3600, Math.floor((nowMs - when) / 1000));
    const arrests = chance(0.32) ? int(1, 3) : 0;
    incidents.push(makeIncident({
      state, type, severity: pick(["critical", "high", "high", "medium", "medium", "low"]), status: "closed", detectedSecAgo: secAgo,
      arrests, recovered: chance(0.4) ? int(3, 60) * 100_000 : 0, claimedLate: chance(0.06),
      suspectIds: chance(0.16) && genericSuspect < suspects.length ? [suspects[genericSuspect++].id] : [],
      vehicleIds: chance(0.08) && genericVehicle < vehicles.length ? [vehicles[genericVehicle++].id] : [],
    }));
  }

  // ── Unit assignment for active incidents ─────────────────────────────
  const active = incidents.filter((i) => i.status !== "closed");
  for (const inc of active) {
    if (["detected", "verified"].includes(inc.status)) { inc.respondingUnitId = null; continue; }
    let unit = inc.respondingUnitId ? unitById.get(inc.respondingUnitId) : undefined;
    if (!unit) {
      unit = units
        .filter((u) => u.state === inc.state && !u.currentAssignment && u.status !== "unavailable" && u.id !== "ABJ-14")
        .sort((a, b) => distanceKm(a.location, inc.location) - distanceKm(b.location, inc.location))[0];
    }
    if (!unit) { inc.status = "verified"; inc.response.stages = { alert: inc.response.stages.alert, verification: inc.response.stages.verification }; continue; }
    inc.respondingUnitId = unit.id;
    unit.currentAssignment = inc.id;
    const origin = unit.location;
    inc.route = routeBetween(origin, inc.location, int(-3, 3));
    inc.response.distanceKm = Math.round(distanceKm(origin, inc.location) * 1.25 * 10) / 10;
    if (inc.status === "dispatched") { unit.status = "assigned"; inc.etaSeconds = Math.round(inc.response.distanceKm / 38 * 3600) + 120; }
    if (inc.status === "en_route") {
      unit.status = "en_route";
      unit.location = { lat: origin.lat + (inc.location.lat - origin.lat) * 0.45, lng: origin.lng + (inc.location.lng - origin.lng) * 0.45 };
      inc.etaSeconds = Math.round(distanceKm(unit.location, inc.location) * 1.25 / 42 * 3600);
    }
    if (inc.status === "on_site" || inc.status === "contained") { unit.status = inc.status === "contained" && chance(0.4) ? "returning" : "on_site"; unit.location = offsetKm(inc.location, 0.05, 0.05); }
  }
  // Historical incidents get a responding unit from their state for scorecards
  for (const inc of incidents.filter((i) => i.status === "closed")) {
    const pool = units.filter((u) => u.state === inc.state);
    inc.respondingUnitId = pool.length ? pick(pool).id : null;
  }

  // ── Cases & investigations ───────────────────────────────────────────
  const cases: InvestigationCase[] = [];
  let caseSeq = 500; // above the featured NSCDC-CNII-2026-00428
  const incById = new Map(incidents.map((i) => [i.id, i]));
  const investigators = Array.from({ length: 14 }, () => `${pick(["CSC", "SC", "DSC"])} ${personName()}`);

  const newCase = (incs: Incident[], opts: Partial<InvestigationCase> = {}): InvestigationCase => {
    const first = incs[0];
    const id = opts.id ?? `NSCDC-CNII-2026-${String(++caseSeq).padStart(5, "0")}`;
    const opened = new Date(first.detectedAt).getTime() + 3 * 3600_000;
    const c: InvestigationCase = {
      id,
      title: `${TYPE_LABEL[first.type]} — ${first.siteName}`,
      incidentIds: incs.map((i) => i.id),
      leadInvestigator: pick(investigators),
      stateCommandId: first.stateCommandId,
      state: first.state,
      openedAt: isoAt(Math.min(opened, nowMs - 600_000)),
      lastActivityAt: isoAt(Math.min(nowMs - 300_000, opened + int(1, 40) * DAY * 1000)),
      status: "open",
      suspectIds: [...new Set(incs.flatMap((i) => i.suspectIds))],
      witnesses: Array.from({ length: int(0, 3) }, () => ({ name: personName(), role: pick(["Site guard", "Resident", "Okada rider", "Operator field engineer", "Shop owner"]), statementTaken: chance(0.7) })),
      vehicleIds: [...new Set(incs.flatMap((i) => i.vehicleIds))],
      evidenceIds: [],
      recoveredAssetIds: [],
      operatorStatements: int(0, 2),
      officerStatements: int(1, 4),
      notes: "",
      ...opts,
    };
    incs.forEach((i) => { i.caseId = id; });
    cases.push(c);
    return c;
  };

  const featuredCase = newCase([inc872, ...crossIds.map((id) => incById.get(id)!)], {
    id: "NSCDC-CNII-2026-00428",
    title: "Kubwa–Dei-Dei cable & battery network (cross-operator)",
    leadInvestigator: "CSC Halima Yusuf",
    notes: "Same crew linked to MTN (Mon), Airtel (Thu) and IHS (Sat) sites within 6 days. Hiace KUJ-482XA seen at 3 sites. Dealer ledger seized at Dei-Dei.",
    status: "open",
  });
  featuredCase.openedAt = isoAt(nowMs - 9 * DAY * 1000 + 5 * 3600_000);
  featuredCase.lastActivityAt = isoAt(nowMs - 9 * 60_000);
  featuredCase.witnesses = [
    { name: "Ibrahim Salisu", role: "Site guard (MTN Kubwa)", statementTaken: true },
    { name: "Grace Effiong", role: "Resident, Phase 4", statementTaken: true },
    { name: "Usman Bello", role: "Okada rider", statementTaken: false },
  ];
  const insiderCase = newCase(apexIds.map((id) => incById.get(id)!), {
    title: "Insider-risk review — battery removals at Apex-serviced sites (FCT)",
    leadInvestigator: "SC Yakubu Garba",
    notes: "Referral IRR-0001. Correlation only — no finding of wrongdoing.",
    suspectIds: [SUS_TECH],
    vehicleIds: [VEH_APEX],
  });

  // Investigations for historical incidents with arrests/value, open by default
  const closedIncs = incidents.filter((i) => i.status === "closed" && !i.caseId);
  for (const inc of closedIncs) {
    if (inc.arrests > 0 || inc.assetsRecoveredNaira > 0 || chance(0.35)) newCase([inc]);
  }
  // Case status distribution: older cases move to prosecution / closed
  const byAge = [...cases].filter((c) => c !== featuredCase && c !== insiderCase).sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  byAge.forEach((c, i) => {
    const k = i / byAge.length;
    c.status = k < 0.18 ? "closed" : k < 0.42 ? "prosecution" : k < 0.46 ? "referred" : "open";
    if (c.status === "open" && chance(0.22)) c.lastActivityAt = isoAt(nowMs - int(31, 70) * DAY * 1000);
  });

  // Extra prosecution-era cases from before the 90-day window (older arrests)
  const prosecutions: ProsecutionCase[] = [];
  const courts = ["Federal High Court, Abuja", "Federal High Court, Kaduna", "Federal High Court, Lagos", "Federal High Court, Port Harcourt", "Federal High Court, Kano", "FCT High Court, Bwari", "Magistrate Court, Wuse Zone 2"];
  const charges = [
    "Vandalism of CNII — s.7 Cybercrimes (Prohibition, Prevention, etc.) (Amendment) Act 2024",
    "Theft of telecom equipment — Criminal Code / Penal Code",
    "Conspiracy and unlawful dealing in stolen telecom property",
    "Malicious damage to critical national information infrastructure",
    "Receiving stolen property (telecom batteries)",
  ];
  const stageFor = (k: number): CaseStage =>
    k < 0.12 ? "charge" : k < 0.38 ? "prosecution" : k < 0.62 ? "hearing" : k < 0.68 ? "judgment" : k < 0.86 ? "sentence" : k < 0.92 ? "appeal" : "closed";
  const prosecutable = cases.filter((c) => c.status === "prosecution" || c.status === "closed");
  const olderCount = 110;
  for (let i = 0; i < olderCount; i++) {
    const filedDaysAgo = int(95, 520);
    const id = `NSCDC-CNII-2025-${String(1000 + i).padStart(5, "0")}`;
    const state = pick(weighted);
    cases.push({
      id, title: `${pick(Object.values(TYPE_LABEL))} — ${state} (legacy)`, incidentIds: [], leadInvestigator: pick(investigators),
      stateCommandId: scByState.get(state)!.id, state, openedAt: isoAgo((filedDaysAgo + 20) * DAY), lastActivityAt: isoAgo(int(1, 60) * DAY),
      status: "prosecution", suspectIds: [], witnesses: [], vehicleIds: [], evidenceIds: [], recoveredAssetIds: [], operatorStatements: 1, officerStatements: 2, notes: "",
    });
    prosecutable.push(cases[cases.length - 1]);
  }
  prosecutable.forEach((c, i) => {
    const filedAgoDays = Math.max(3, Math.round((nowMs - new Date(c.openedAt).getTime()) / 86400000) - int(2, 20));
    const k = c.status === "closed" ? 0.75 + r() * 0.25 : r() * 0.9;
    const stage = stageFor(k);
    const conviction = ["sentence", "appeal", "closed"].includes(stage) ? chance(0.85) : stage === "judgment" ? chance(0.7) : false;
    const dismissed = stage === "closed" && !conviction;
    const defendants = c.suspectIds.length ? c.suspectIds.map((sid) => suspects.find((s) => s.id === sid)?.name ?? "Unknown").filter(Boolean) : Array.from({ length: int(1, 3) }, () => personName());
    prosecutions.push({
      id: `PRC-${String(i + 1).padStart(4, "0")}`,
      caseId: c.id,
      stage,
      prosecutor: `${pick(["Barr.", "ACC (Legal)", "DSC (Legal)"])} ${personName()}`,
      court: pick(courts),
      charge: pick(charges),
      defendants,
      evidenceSubmitted: int(2, 14),
      filedAt: isoAgo(filedAgoDays * DAY),
      nextHearing: ["charge", "prosecution", "hearing", "judgment", "appeal"].includes(stage) ? isoAt(nowMs + int(2, 60) * DAY * 1000) : null,
      adjournments: Array.from({ length: int(0, 5) }, () => ({ at: isoAgo(int(5, filedAgoDays) * DAY), reason: pick(["Defence counsel absent", "Prosecution witness unavailable", "Court did not sit", "Awaiting forensic report", "Defendant not produced from custody"]) })),
      judgment: conviction ? "Convicted" : dismissed ? "Dismissed — insufficient evidence" : stage === "judgment" ? "Reserved" : null,
      sentence: conviction && stage !== "judgment" ? pick(["5 years imprisonment", "7 years imprisonment", "3 years or ₦2m fine", "10 years imprisonment", "4 years + restitution"]) : null,
      recoveredAssetsNaira: chance(0.5) ? int(5, 90) * 100_000 : 0,
    });
  });

  // ── Evidence & chain of custody ──────────────────────────────────────
  const evidence: EvidenceItem[] = [];
  let evdSeq = 43000; // above the featured EVD-2026-042891
  const custodyTrail = (captured: number, acquiredBy: string, intact: boolean): CustodyEvent[] => {
    const trail: CustodyEvent[] = [
      { at: isoAt(captured), actor: "ITIPS Edge Gateway", action: "captured" },
      { at: isoAt(captured + 4000), actor: "ITIPS Evidence Vault", action: "hashed", note: "SHA-256 computed at ingest" },
      { at: isoAt(captured + 6000), actor: "ITIPS Evidence Vault", action: "ingested" },
    ];
    let tms = captured + int(1, 6) * 3600_000;
    if (tms < nowMs) trail.push({ at: isoAt(tms), actor: acquiredBy, action: "viewed" });
    tms += int(2, 30) * 3600_000;
    if (tms < nowMs) trail.push({ at: isoAt(tms), actor: acquiredBy, action: "verified", note: "Hash re-verified against original" });
    if (!intact) trail.push({ at: isoAt(Math.min(nowMs - 3600_000, tms + 7200_000)), actor: "Unknown workstation (ABJ-WS-17)", action: "exported", note: "Export without case-officer authorisation — custody gap" });
    return trail;
  };
  const addEvidence = (c: InvestigationCase, inc: Incident | undefined, kind: EvidenceKind, title: string, device: string, capturedMs: number, opts: Partial<EvidenceItem> = {}) => {
    const intact = opts.custodyIntact ?? chance(0.94);
    const id = opts.id ?? `EVD-2026-${String(++evdSeq).padStart(6, "0")}`;
    const item: EvidenceItem = {
      id, caseId: c.id, incidentId: inc?.id ?? c.incidentIds[0] ?? "", kind, title,
      source: kind === "video" || kind === "image" ? "ITIPS camera network" : kind === "sensor_log" ? "ITIPS sensor fabric" : kind === "access_log" ? "Operator access control" : kind === "gps_track" ? "NSCDC fleet GPS" : "NSCDC investigator",
      originatingDevice: device,
      capturedAt: isoAt(capturedMs),
      location: inc?.location ?? scByState.get(c.state)!.location,
      sha256: hex(64),
      hashVerified: opts.hashVerified ?? chance(0.97),
      acquiredBy: opts.acquiredBy ?? (kind === "statement" ? c.leadInvestigator : "ITIPS (automated)"),
      custody: [],
      exports: [],
      custodyIntact: intact,
      preview: kind === "image" || kind === "video" ? pick(EVIDENCE_IMAGES) : undefined,
      ...opts,
    };
    item.custody = custodyTrail(capturedMs, c.leadInvestigator, intact);
    item.exports = item.custody.filter((e) => e.action === "exported").map((e) => ({ at: e.at, to: e.note?.includes("without") ? "USB mass storage" : "Prosecution bundle", by: e.actor }));
    if (chance(0.25) && intact) item.exports.push({ at: isoAt(Math.min(nowMs - 600_000, capturedMs + 5 * DAY * 1000)), to: "Prosecution bundle (s.84 Evidence Act certificate attached)", by: c.leadInvestigator });
    evidence.push(item);
    c.evidenceIds.push(id);
    return item;
  };

  // Featured evidence from the brief
  const t0ms = new Date(inc872.detectedAt).getTime();
  addEvidence(featuredCase, inc872, "video", "Camera 02 footage", "CAM-ABJ-0042", t0ms + 2000, { id: "EVD-2026-042891", hashVerified: true, custodyIntact: true, preview: "/evidence/intruder-snapshot.jpg" });
  addEvidence(featuredCase, inc872, "sensor_log", "Radar + fence vibration log (Zone 3)", "RDR-ABJ-0042 / FVS-ABJ-0042-Z3", t0ms, { hashVerified: true, custodyIntact: true });
  addEvidence(featuredCase, inc872, "image", "Suspect still — cutting tool visible", "CAM-ABJ-0042", t0ms + 11000, { hashVerified: true, custodyIntact: true, preview: "/evidence/cctv-feed-nigerian-mast.jpg" });
  addEvidence(featuredCase, inc872, "gps_track", "ABJ-12 GPS track (dispatch → arrival)", "GPS-NSCDC-ABJ12", t0ms + 98000, { hashVerified: true, custodyIntact: true });
  addEvidence(featuredCase, inc872, "statement", "Statement of arresting officer", "ITIPS Case Desk", t0ms + 1200_000, { hashVerified: true, custodyIntact: true });
  for (const id of crossIds) {
    const inc = incById.get(id)!;
    const tm = new Date(inc.detectedAt).getTime();
    addEvidence(featuredCase, inc, "video", `CCTV — ${inc.siteName}`, `CAM-${inc.siteId}`, tm + 3000, { preview: pick(EVIDENCE_IMAGES) });
    addEvidence(featuredCase, inc, "access_log", `Site access log — ${inc.operator}`, `ACS-${inc.siteId}`, tm - 3600_000);
  }
  addEvidence(featuredCase, undefined, "document", "Dealer ledger seized at Dei-Dei (14 pages)", "Seizure — Exhibit D3", nowMs - 2 * DAY * 1000);
  addEvidence(featuredCase, undefined, "forensic", "Bolt-cutter tool-mark comparison", "NSCDC Forensic Lab Abuja", nowMs - 1 * DAY * 1000);
  for (const id of apexIds) {
    const inc = incById.get(id)!;
    addEvidence(insiderCase, inc, "access_log", `Access record — Apex crew visit before ${inc.siteName}`, `ACS-${inc.siteId}`, new Date(inc.detectedAt).getTime() - 18 * 3600_000);
  }
  // Remaining cases (recent ones only, keeps the payload small)
  const recentCases = cases.filter((c) => c !== featuredCase && c !== insiderCase && c.incidentIds.length && c.status !== "closed").slice(-90);
  for (const c of recentCases) {
    const inc = incById.get(c.incidentIds[0])!;
    const tm = new Date(inc.detectedAt).getTime();
    const kinds: [EvidenceKind, string][] = [["video", "Site CCTV clip"], ["sensor_log", "Sensor event log"], ["image", "Scene photograph"], ["statement", "Witness statement"], ["access_log", "Operator access log"]];
    for (const [kind, title] of kinds.slice(0, int(2, 5))) addEvidence(c, inc, kind, title, kind === "statement" ? "ITIPS Case Desk" : `${kind === "access_log" ? "ACS" : "CAM"}-${inc.siteId}`, tm + int(1, 120) * 1000);
  }

  // ── Stolen asset registry ─────────────────────────────────────────────
  const stolenAssets: StolenAsset[] = [];
  const theftIncs = incidents.filter((i) => ["battery_generator_theft", "theft", "cable_theft"].includes(i.type) && i.status === "closed");
  const assetSpec = {
    battery: { makers: ["Narada", "Shoto", "Vision", "Huawei"], value: [450_000, 1_400_000] },
    generator: { makers: ["Perkins", "Mikano", "FG Wilson", "Cummins"], value: [6_000_000, 14_000_000] },
    cable: { makers: ["Nexans", "Coleman", "Cutix"], value: [180_000, 900_000] },
    solar_panel: { makers: ["Jinko", "Canadian Solar", "Longi"], value: [120_000, 350_000] },
    rectifier: { makers: ["Eltek", "Delta", "Huawei"], value: [900_000, 2_500_000] },
    antenna: { makers: ["Ericsson", "Huawei", "CommScope"], value: [700_000, 2_000_000] },
  } as const;
  const marketByState = (state: string) => RECOVERY_MARKETS.filter((m) => m.state === state);
  for (const inc of theftIncs.slice(0, 120)) {
    const type: StolenAsset["equipmentType"] = inc.type === "cable_theft" ? "cable" : inc.type === "battery_generator_theft" ? (chance(0.75) ? "battery" : "generator") : pick(["solar_panel", "rectifier", "antenna", "battery"]);
    const spec = assetSpec[type];
    const count = type === "battery" ? int(1, 4) : 1;
    for (let k = 0; k < count; k++) {
      const markets = marketByState(inc.state);
      // Recovery is concentrated in a few markets per region
      const status: StolenAsset["recoveryStatus"] = chance(0.42) ? "recovered" : chance(0.25) ? "tracked" : chance(0.9) ? "missing" : "destroyed";
      const market = markets.length ? (chance(0.75) ? markets[0] : pick(markets)) : pick(RECOVERY_MARKETS);
      const stolenMs = new Date(inc.detectedAt).getTime();
      stolenAssets.push({
        id: `SAR-${String(stolenAssets.length + 1).padStart(5, "0")}`,
        equipmentType: type,
        manufacturer: pick(spec.makers),
        serialNumber: `${type.slice(0, 2).toUpperCase()}${hex(3).toUpperCase()}-${int(100000, 999999)}`,
        operator: inc.operator,
        siteId: inc.siteId,
        siteName: inc.siteName,
        valueNaira: int(spec.value[0] / 10000, spec.value[1] / 10000) * 10000,
        stolenAt: inc.detectedAt,
        incidentId: inc.id,
        trackerLocation: status === "tracked" ? offsetKm(market, (r() - 0.5) * 6, (r() - 0.5) * 6) : null,
        recoveryStatus: status,
        recoveryLocation: status === "recovered" ? { name: market.name, location: offsetKm(market, (r() - 0.5) * 0.6, (r() - 0.5) * 0.6) } : null,
        recoveredAt: status === "recovered" ? isoAt(Math.min(nowMs - 3600_000, stolenMs + int(1, 25) * DAY * 1000)) : null,
        suspectId: inc.suspectIds[0] ?? null,
        receivingDealer: status === "recovered" && chance(0.6) ? `${pick(["Alh.", "Mr.", "Chief"])} ${pick(LAST)} (${market.name.split(" ")[0]} dealer)` : null,
      });
      if (inc.caseId) cases.find((c) => c.id === inc.caseId)?.recoveredAssetIds.push(stolenAssets[stolenAssets.length - 1].id);
    }
  }

  // ── Insider-collusion: work-order visits & referrals ─────────────────
  const visits: WorkOrderVisit[] = [];
  const contractors = ["Apex Telecoms Services Ltd", "Bluewave Tower Maintenance", "Northfield Power Solutions", "Zenra Field Services", "Kadmos Engineering"];
  const addVisit = (v: Omit<WorkOrderVisit, "id">) => { const id = `VIS-${String(visits.length + 1).padStart(5, "0")}`; visits.push({ id, ...v }); return id; };
  const apexVisitIds = apexIds.map((id, i) => {
    const inc = incById.get(id)!;
    return addVisit({
      technician: i === 2 ? "Unregistered crew (3 persons)" : "Emeka Onyeka", contractor: "Apex Telecoms Services Ltd", vehiclePlate: "ABC-219KS",
      siteId: inc.siteId, siteName: inc.siteName, operator: inc.operator, visitAt: isoAt(new Date(inc.detectedAt).getTime() - (i === 0 ? 18 : int(10, 40)) * 3600_000),
      workOrder: i === 2 ? null : `WO-${inc.operator.slice(0, 3).toUpperCase()}-${int(20000, 99999)}`, cameraObstructed: i === 1, assetsTouched: ["Battery cabinet", "Rectifier"],
    });
  });
  for (let i = 0; i < 64; i++) {
    const inc = pick(incidents);
    addVisit({
      technician: personName(), contractor: pick(contractors.slice(1)), vehiclePlate: plate(pick(["ABJ", "KAD", "LAG", "KAN"])),
      siteId: inc.siteId, siteName: inc.siteName, operator: inc.operator, visitAt: isoAgo(int(1, 80) * DAY),
      workOrder: chance(0.95) ? `WO-${inc.operator.slice(0, 3).toUpperCase()}-${int(20000, 99999)}` : null, cameraObstructed: chance(0.03),
      assetsTouched: [pick(["Generator", "Battery cabinet", "Feeder cables", "Rectifier", "Solar array", "Air conditioner"])],
    });
  }
  const insiderReferrals: InsiderReferral[] = [
    {
      id: "IRR-0001", subject: "Apex Telecoms Services Ltd", subjectKind: "contractor", riskScore: 82,
      pattern: "Same contractor accessed four sites subsequently vandalised",
      indicators: ["4 of 4 visited sites lost batteries within 48h", "Same vehicle ABC-219KS at all four visits", "Removal pattern matches battery-cabinet access"],
      linkedVisitIds: apexVisitIds, linkedIncidentIds: apexIds, status: "under_review", createdAt: isoAgo(5 * DAY),
    },
    {
      id: "IRR-0002", subject: "Emeka Onyeka (technician)", subjectKind: "technician", riskScore: 67,
      pattern: "Technician visits Site A → batteries disappear 18 hours later",
      indicators: ["Visit ended 18h before alarm", "Assets touched: battery cabinet", "Repeated at 2 other sites"],
      linkedVisitIds: [apexVisitIds[0], apexVisitIds[3]], linkedIncidentIds: [apexIds[0], apexIds[3]], status: "flagged", createdAt: isoAgo(3 * DAY),
    },
    {
      id: "IRR-0003", subject: "Unregistered crew (Apex vehicle)", subjectKind: "crew", riskScore: 74,
      pattern: "Maintenance crew arrived without valid work order",
      indicators: ["No work order on operator system", "Gate opened with contractor PIN", "Vehicle matches contractor fleet"],
      linkedVisitIds: [apexVisitIds[2]], linkedIncidentIds: [apexIds[2]], status: "referred", createdAt: isoAgo(11 * DAY),
    },
    {
      id: "IRR-0004", subject: "Apex crew — Jabi visit", subjectKind: "crew", riskScore: 58,
      pattern: "Camera deliberately obstructed during authorised visit",
      indicators: ["CAM-02 view blocked for 22 min during visit", "Obstruction began 2 min after gate entry", "Battery removal detected next night"],
      linkedVisitIds: [apexVisitIds[1]], linkedIncidentIds: [apexIds[1]], status: "under_review", createdAt: isoAgo(16 * DAY),
    },
    {
      id: "IRR-0005", subject: "Bluewave Tower Maintenance", subjectKind: "contractor", riskScore: 31,
      pattern: "Elevated diesel variance after scheduled refuelling",
      indicators: ["Fuel level drop 140L within 6h of refuel at 3 sites", "No work order mismatch", "Could be meter calibration"],
      linkedVisitIds: visits.filter((v) => v.contractor === "Bluewave Tower Maintenance").slice(0, 3).map((v) => v.id), linkedIncidentIds: [], status: "cleared", createdAt: isoAgo(24 * DAY),
    },
  ];

  // ── Threat relationship graph ─────────────────────────────────────────
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const node = (id: string, kind: GraphNode["kind"], label: string, meta?: GraphNode["meta"]) => { if (!nodes.find((n) => n.id === id)) nodes.push({ id, kind, label, meta }); };
  const edge = (from: string, to: string, relation: string, confidence: number, source: string) => edges.push({ from, to, relation, confidence, source });
  const sus = (id: string) => suspects.find((s) => s.id === id)!;
  for (const sid of [SUS_SCORPION, SUS_BABA, SUS_SMALL, SUS_TECH]) node(sid, "person", sus(sid).name ? `${sus(sid).name}${sus(sid).alias !== "—" ? ` ("${sus(sid).alias}")` : ""}` : `Unidentified ("${sus(sid).alias}")`, { status: sus(sid).status });
  node("PH-1123", "phone", "+234 803 ••• 1123", { basis: "Lawful order FHC/ABJ/CS/1182/2026" });
  node("PH-7740", "phone", "+234 816 ••• 7740", { basis: "Seized handset, Exhibit D1" });
  node(VEH_HIACE, "vehicle", "Hiace KUJ-482XA");
  node(VEH_KEKE, "vehicle", "Yellow keke (unregistered)");
  node(VEH_APEX, "vehicle", "Corolla ABC-219KS");
  node("CTR-APEX", "contractor", "Apex Telecoms Services Ltd");
  node("DLR-DEIDEI", "dealer", "Dei-Dei scrap dealer (Alh. Shehu)");
  node("TOOL-BC", "tool", "Bolt cutters (Exhibit D2)");
  node(featuredCase.id, "case", featuredCase.id);
  node(insiderCase.id, "case", insiderCase.id);
  for (const id of [inc872.id, ...crossIds]) { const inc = incById.get(id)!; node(id, "incident", `${id} · ${inc.operator}`, { operator: inc.operator, date: inc.detectedAt.slice(0, 10) }); node(inc.siteId, "site", inc.siteName, { operator: inc.operator }); edge(id, inc.siteId, "occurred at", 1, "ITIPS incident record"); edge(id, featuredCase.id, "part of", 1, "Case file"); }
  for (const id of apexIds) { const inc = incById.get(id)!; node(id, "incident", `${id} · ${inc.operator}`, { operator: inc.operator }); node(inc.siteId, "site", inc.siteName); edge(id, inc.siteId, "occurred at", 1, "ITIPS incident record"); edge("CTR-APEX", inc.siteId, "serviced 10–40h before incident", 0.9, "Operator work-order system"); edge(id, insiderCase.id, "under review in", 1, "Case file"); }
  edge(SUS_SCORPION, inc872.id, "apprehended at", 1, "Arrest record ABJ-12");
  edge(SUS_SCORPION, crossIds[0], "seen on CCTV", 0.82, "CAM footage, facial similarity (analyst-confirmed)");
  edge(SUS_SCORPION, crossIds[2], "seen on CCTV", 0.71, "CAM footage, analyst review");
  edge(SUS_SMALL, inc872.id, "seen on CCTV", 0.88, "EVD-2026-042891");
  edge(SUS_SMALL, crossIds[0], "seen on CCTV", 0.8, "CCTV, red cap");
  edge(SUS_SMALL, crossIds[1], "seen on CCTV", 0.77, "CCTV, red cap");
  edge(SUS_BABA, crossIds[1], "transported goods from", 0.64, "Okada rider witness statement");
  edge(SUS_BABA, "DLR-DEIDEI", "sold to", 0.86, "Dealer ledger, Exhibit D3");
  edge(SUS_SCORPION, "PH-7740", "carried", 1, "Seized at arrest");
  edge("PH-7740", "PH-1123", "called 46× (7 days)", 0.95, "Lawful call-record order");
  edge(SUS_BABA, "PH-1123", "subscriber of", 0.7, "Lawful subscriber check (NIN-linked)");
  edge(VEH_HIACE, inc872.id, "present at", 0.9, "ANPR CAM-ABJ-0042");
  edge(VEH_HIACE, crossIds[0], "present at", 0.85, "ANPR operator camera");
  edge(VEH_HIACE, crossIds[1], "present at", 0.72, "Resident witness");
  edge(VEH_KEKE, crossIds[2], "present at", 0.6, "CCTV, partial");
  edge(SUS_SCORPION, VEH_HIACE, "drove", 0.75, "Arrest statement");
  edge("TOOL-BC", inc872.id, "used at", 0.93, "Tool-mark comparison (forensic)");
  edge("TOOL-BC", crossIds[0], "used at", 0.68, "Tool-mark comparison (forensic)");
  edge(SUS_TECH, "CTR-APEX", "employed by", 1, "Contractor roster");
  edge(VEH_APEX, "CTR-APEX", "registered to", 1, "Fleet list");
  edge(SUS_TECH, VEH_APEX, "used", 0.9, "Access log entries");
  const recoveredAtDeiDei = stolenAssets.filter((a) => a.recoveryLocation?.name.startsWith("Dei-Dei")).slice(0, 4);
  for (const a of recoveredAtDeiDei) { node(a.id, "asset", `${a.equipmentType} ${a.serialNumber}`, { value: a.valueNaira }); edge(a.id, "DLR-DEIDEI", "recovered from", 0.95, "Recovery report"); }
  // Second, independent network in Kaduna (lighter)
  const kadIncs = incidents.filter((i) => i.state === "Kaduna" && i.type === "cable_theft").slice(0, 4);
  node("SUS-K1", "person", 'Unidentified ("Wire")', { status: "unidentified" });
  node("DLR-BARCI", "dealer", "Kasuwan Barci cable buyer");
  for (const inc of kadIncs) { node(inc.id, "incident", `${inc.id} · ${inc.operator}`, { operator: inc.operator }); edge("SUS-K1", inc.id, "seen on CCTV", 0.55 + r() * 0.3, "CCTV, analyst review"); }
  edge("SUS-K1", "DLR-BARCI", "sold to", 0.58, "Informant report (unverified)");

  // ── Threat intelligence ───────────────────────────────────────────────
  const recent90 = incidents.filter((i) => nowMs - new Date(i.detectedAt).getTime() < 90 * DAY * 1000);
  const riskCells: RiskCell[] = STATES.map((s) => {
    const list = recent90.filter((i) => i.state === s.state);
    const byType = { vandalism: 0, theft: 0, armed_intrusion: 0, cable_theft: 0, battery_generator_theft: 0, tower_sabotage: 0 } as Record<IncidentType, number>;
    const byHour = Array(24).fill(0);
    const ops = new Map<Operator, number>();
    const mos = new Map<ModusOperandi, number>();
    for (const i of list) {
      byType[i.type]++;
      byHour[(new Date(i.detectedAt).getUTCHours() + 1) % 24]++; // WAT = UTC+1
      ops.set(i.operator, (ops.get(i.operator) ?? 0) + 1);
      for (const m of i.modusOperandi) mos.set(m, (mos.get(m) ?? 0) + 1);
    }
    const top = <K,>(m: Map<K, number>, fallback: K) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
    const risk = Math.min(98, Math.round(list.length * 2.6 + (s.state === "Kaduna" ? 18 : 0) + r() * 8));
    return { state: s.state, zone: s.zone, risk, incidents90d: list.length, byType, byHour, topOperator: top(ops, "MTN" as Operator), topModus: top(mos, "cable_cutting" as ModusOperandi) };
  });

  const hotspots: Hotspot[] = [
    { name: "Kubwa–Dutse–Zuba belt", lat: 9.14, lng: 7.33, state: "FCT", type: "cable_theft" as IncidentType, r: 9 },
    { name: "Lugbe–Airport Road", lat: 8.98, lng: 7.37, state: "FCT", type: "battery_generator_theft" as IncidentType, r: 6 },
    { name: "Kawo–Malali", lat: 10.55, lng: 7.45, state: "Kaduna", type: "battery_generator_theft" as IncidentType, r: 5 },
    { name: "Kateri / Abuja–Kaduna Hwy", lat: 9.85, lng: 7.33, state: "Kaduna", type: "cable_theft" as IncidentType, r: 14 },
    { name: "Alimosho (Ikotun–Egbeda)", lat: 6.57, lng: 3.28, state: "Lagos", type: "tower_sabotage" as IncidentType, r: 7 },
    { name: "Oyigbo–Eleme", lat: 4.84, lng: 7.12, state: "Rivers", type: "armed_intrusion" as IncidentType, r: 8 },
    { name: "Kano–Katsina Road", lat: 12.15, lng: 8.4, state: "Kano", type: "cable_theft" as IncidentType, r: 12 },
    { name: "Suleja–Madalla", lat: 9.18, lng: 7.18, state: "Niger", type: "battery_generator_theft" as IncidentType, r: 6 },
  ].map((h, i) => ({ id: `HS-${i + 1}`, name: h.name, location: { lat: h.lat, lng: h.lng }, radiusKm: h.r, incidents90d: recent90.filter((x) => distanceKm(x.location, { lat: h.lat, lng: h.lng }) < h.r * 1.5).length + int(4, 12), dominantType: h.type }));

  const corridors: Corridor[] = CORRIDORS.map((c, i) => ({ ...c, risk: [86, 61, 72, 58, 49][i], trend: (["rising", "stable", "rising", "stable", "falling"] as const)[i] }));

  const predictions: ThreatPrediction[] = [
    { id: "PRD-01", headline: "Kaduna North battery theft risk elevated +34%", region: "Kaduna North, Kaduna", kind: "risk_increase", changePct: 34, confidence: 0.78, location: { lat: 10.55, lng: 7.45 }, basis: ["9 battery thefts in 21 days vs 6.7 baseline", "4 incidents between 01:00–03:00", "Recovered batteries surfacing at Kasuwan Barci"], recommendations: ["Increase night patrol 00:00–04:00 around Kawo/Malali", "Inspect 6 sites with lithium battery banks", "Warn MTN and IHS of elevated risk", "Coordinate with Police Kaduna Command"] },
    { id: "PRD-02", headline: "Six sites show correlated reconnaissance activity", region: "Bwari / AMAC, FCT", kind: "reconnaissance", changePct: null, confidence: 0.66, location: { lat: 9.13, lng: 7.38 }, basis: ["Same Hiace KUJ-482XA near 6 sites at night", "Short loiter events (<4 min) on perimeter radar", "Pattern preceded the Kubwa/Dutse/Zuba incidents"], recommendations: ["Monitor identified vehicle (ANPR watchlist)", "Inspect the 6 named sites", "Pre-position ABJ-14 at Dutse junction 22:00–04:00"] },
    { id: "PRD-03", headline: "Cable theft cluster expanding along Abuja–Kaduna corridor", region: "Abuja–Kaduna Expressway", kind: "cluster_expansion", changePct: 21, confidence: 0.71, location: { lat: 9.85, lng: 7.33 }, basis: ["Cluster centroid moved 18 km north in 30 days", "Fibre and feeder-cable cuts at 5 roadside sites", "Kasuwan Barci buyer linked by informant"], recommendations: ["Reposition corridor patrol to Kateri–Jere stretch", "Reinforce KAD-14 temporarily", "Targeted investigation of Kasuwan Barci buyer"] },
    { id: "PRD-04", headline: "Response coverage gap detected around Cluster NG-44", region: "Oyigbo–Eleme, Rivers", kind: "coverage_gap", changePct: null, confidence: 0.83, location: { lat: 4.84, lng: 7.12 }, basis: ["Median ETA 27 min vs 15 min target", "2 of 4 PHC units committed at peak hours", "3 armed intrusions in 30 days"], recommendations: ["Temporarily reinforce response unit at Oyigbo", "Coordinate with Police for armed backup", "Request operator to relocate guard post"] },
    { id: "PRD-05", headline: "Generator theft risk rising in Alimosho after diesel-price spike", region: "Alimosho, Lagos", kind: "risk_increase", changePct: 17, confidence: 0.57, location: { lat: 6.57, lng: 3.28 }, basis: ["Diesel siphoning reports +40% month-on-month", "Generator theft historically follows siphoning", "Ladipo market listings for used Perkins sets up"], recommendations: ["Increase night patrol in Ikotun–Egbeda", "Warn operators to verify fuel deliveries"] },
  ];

  // ── Scorecards (unit → area → state → zone) ──────────────────────────
  const unitRows: ScorecardRow[] = units.map((u) => {
    const list = incidents.filter((i) => i.respondingUnitId === u.id);
    const withArr = list.filter((i) => i.response.stages.arrival);
    const secs = (a?: string, b?: string) => (a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 1000 : null);
    const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : 0; };
    const ack = avg(list.map((i) => secs(i.response.stages.dispatch, i.response.stages.acceptance)));
    const mob = avg(list.map((i) => secs(i.response.stages.acceptance, i.response.stages.departure)));
    const resp = avg(withArr.map((i) => secs(i.response.stages.alert, i.response.stages.arrival)));
    const sla = withArr.length ? Math.round((withArr.filter((i) => !i.response.breached).length / withArr.length) * 1000) / 10 : 100;
    const arrests = list.reduce((s, i) => s + i.arrests, 0);
    const rec = list.reduce((s, i) => s + i.assetsRecoveredNaira, 0);
    const evidenceCompleteness = int(68, 99);
    const reportCompletion = int(60, 100);
    const falseDispatches = int(0, 3);
    const repeat = int(0, 4);
    const conductFlags = chance(0.12) ? int(1, 2) : 0;
    const pResponse = Math.max(0, Math.min(100, Math.round(sla * 0.7 + Math.max(0, 100 - resp / 18) * 0.3)));
    const pPrevention = Math.max(0, 100 - repeat * 14 - falseDispatches * 6);
    const pConduct = Math.max(0, 100 - conductFlags * 30);
    const pEvidence = Math.round((evidenceCompleteness + reportCompletion) / 2);
    const pOutcomes = Math.min(100, 45 + list.filter((i) => i.caseId).length * 6 + Math.min(arrests, 5) * 4);
    const composite = Math.round(pResponse * 0.3 + pPrevention * 0.2 + pConduct * 0.15 + pEvidence * 0.2 + pOutcomes * 0.15);
    return {
      id: u.id, level: "unit", name: u.callsign, parentId: u.areaCommandId, incidentsAssigned: list.length, ackSeconds: ack, mobilisationSeconds: mob, responseSeconds: resp,
      slaCompliance: sla, successfulInterventions: list.filter((i) => i.arrests > 0 || i.assetsRecoveredNaira > 0).length, arrests, recoveriesNaira: rec, falseDispatches,
      evidenceCompleteness, reportCompletion, repeatIncidents: repeat, conductFlags, composite,
      pillars: { response: pResponse, prevention: pPrevention, conduct: pConduct, evidence: pEvidence, outcomes: pOutcomes },
    };
  });
  const rollup = (rows: ScorecardRow[], id: string, level: ScorecardRow["level"], name: string, parentId: string | null): ScorecardRow => {
    const n = rows.length || 1;
    const wavg = (f: (x: ScorecardRow) => number) => Math.round(rows.reduce((s, x) => s + f(x) * Math.max(1, x.incidentsAssigned), 0) / Math.max(1, rows.reduce((s, x) => s + Math.max(1, x.incidentsAssigned), 0)));
    const avgP = (k: keyof ScorecardRow["pillars"]) => Math.round(rows.reduce((s, x) => s + x.pillars[k], 0) / n);
    const pillars = { response: avgP("response"), prevention: avgP("prevention"), conduct: avgP("conduct"), evidence: avgP("evidence"), outcomes: avgP("outcomes") };
    return {
      id, level, name, parentId,
      incidentsAssigned: rows.reduce((s, x) => s + x.incidentsAssigned, 0),
      ackSeconds: wavg((x) => x.ackSeconds), mobilisationSeconds: wavg((x) => x.mobilisationSeconds), responseSeconds: wavg((x) => x.responseSeconds),
      slaCompliance: Math.round(rows.reduce((s, x) => s + x.slaCompliance, 0) / n * 10) / 10,
      successfulInterventions: rows.reduce((s, x) => s + x.successfulInterventions, 0), arrests: rows.reduce((s, x) => s + x.arrests, 0),
      recoveriesNaira: rows.reduce((s, x) => s + x.recoveriesNaira, 0), falseDispatches: rows.reduce((s, x) => s + x.falseDispatches, 0),
      evidenceCompleteness: wavg((x) => x.evidenceCompleteness), reportCompletion: wavg((x) => x.reportCompletion),
      repeatIncidents: rows.reduce((s, x) => s + x.repeatIncidents, 0), conductFlags: rows.reduce((s, x) => s + x.conductFlags, 0),
      composite: Math.round(pillars.response * 0.3 + pillars.prevention * 0.2 + pillars.conduct * 0.15 + pillars.evidence * 0.2 + pillars.outcomes * 0.15),
      pillars,
    };
  };
  const areaRows = stateCommands.flatMap((sc) => sc.areaCommands.map((ac) => rollup(unitRows.filter((u) => u.parentId === ac.id), ac.id, "area", ac.name, sc.id)));
  const stateRows = stateCommands.map((sc) => rollup(areaRows.filter((a) => a.parentId === sc.id), sc.id, "state", `${sc.state} State Command`, `ZONE-${sc.zone}`));
  const zones = [...new Set(STATES.map((s) => s.zone))] as Zone[];
  const zoneRows = zones.map((z) => rollup(stateRows.filter((s) => s.parentId === `ZONE-${z}`), `ZONE-${z}`, "zone", z, null));
  const scorecards = [...zoneRows, ...stateRows, ...areaRows.filter((a) => a.incidentsAssigned > 0), ...unitRows];

  // ── KPIs ─────────────────────────────────────────────────────────────
  const activeIncs = incidents.filter((i) => i.status !== "closed");
  const day = incidents.filter((i) => nowMs - new Date(i.detectedAt).getTime() < DAY * 1000);
  const last30 = incidents.filter((i) => nowMs - new Date(i.detectedAt).getTime() < 30 * DAY * 1000 && i.response.stages.arrival);
  const respSecs = last30.map((i) => (new Date(i.response.stages.arrival!).getTime() - new Date(i.response.stages.alert!).getTime()) / 1000);
  const year = new Date(nowMs).getUTCFullYear();
  const kpis: ExecutiveKpis = {
    activeIncidents: activeIncs.length,
    criticalIncidents: activeIncs.filter((i) => i.severity === "critical").length,
    teamsDispatched: activeIncs.filter((i) => ["dispatched", "en_route", "on_site"].includes(i.status)).length,
    teamsOnSite: units.filter((u) => u.status === "on_site").length,
    avgResponseSeconds: respSecs.length ? Math.round(respSecs.reduce((s, x) => s + x, 0) / respSecs.length) : 0,
    slaMetPct: last30.length ? Math.round((last30.filter((i) => !i.response.breached).length / last30.length) * 1000) / 10 : 100,
    arrestsToday: day.reduce((s, i) => s + i.arrests, 0),
    assetsRecoveredNairaToday: day.reduce((s, i) => s + i.assetsRecoveredNaira, 0),
    openInvestigations: cases.filter((c) => c.status === "open" || c.status === "referred").length,
    casesUnderProsecution: prosecutions.filter((p) => ["charge", "prosecution", "hearing", "judgment", "appeal"].includes(p.stage)).length,
    // No judgment dates in the dataset, so YTD ≈ convictions on cases filed this calendar year
    convictionsYtd: prosecutions.filter((p) => p.judgment === "Convicted" && new Date(p.filedAt).getUTCFullYear() === year).length,
  };
  const prosecutionKpis: ProsecutionKpis = {
    arrests: incidents.reduce((s, i) => s + i.arrests, 0) + prosecutions.reduce((s, p) => s + p.defendants.length, 0),
    casesFiled: prosecutions.length,
    activeProsecutions: kpis.casesUnderProsecution,
    convictions: prosecutions.filter((p) => p.judgment === "Convicted").length,
    dismissed: prosecutions.filter((p) => p.judgment?.startsWith("Dismissed")).length,
    pending: prosecutions.filter((p) => !p.judgment).length,
    avgCaseDurationDays: Math.round(prosecutions.reduce((s, p) => s + (nowMs - new Date(p.filedAt).getTime()) / 86400000, 0) / Math.max(1, prosecutions.length)),
  };

  // Vehicles: remember where they were seen
  for (const inc of incidents) for (const vid of inc.vehicleIds) { const v = vehicles.find((x) => x.id === vid); if (v && !v.seenAt.includes(inc.siteId)) v.seenAt.push(inc.siteId); }

  return {
    generatedAt: isoAt(nowMs),
    kpis,
    stateCommands,
    formations,
    units,
    incidents: incidents.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)),
    suspects,
    vehicles,
    evidence,
    cases,
    prosecutions,
    prosecutionKpis,
    stolenAssets,
    visits,
    insiderReferrals,
    graph: { nodes, edges },
    hotspots,
    corridors,
    riskCells,
    predictions,
    scorecards,
  };
}
