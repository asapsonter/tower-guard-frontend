/**
 * Shared types for the ITIPS Operator Command API.
 *
 * Imported by the serverless handlers (api/*.ts), the Vite dev middleware and
 * the React client — keep this file dependency-free.
 */

export type Zone = "North-Central" | "North-East" | "North-West" | "South-East" | "South-South" | "South-West";
export type Tenant = "MTN" | "Airtel" | "Glo" | "9mobile";
export type SiteClass = "Hub" | "P1" | "P2" | "P3";
export type TowerType = "Greenfield lattice" | "Rooftop" | "Monopole" | "Guyed mast" | "Camouflage";
export type RiskClass = "Very high" | "High" | "Medium" | "Low";

/** Site operating state, in escalating order. */
export type SiteState = "normal" | "warning" | "incident" | "critical" | "offline" | "maintenance";
export const SITE_STATES: SiteState[] = ["normal", "warning", "incident", "critical", "offline", "maintenance"];

export type ProtectionState = "FULLY PROTECTED" | "DEGRADED BUT OPERATIONAL" | "PROTECTION AT RISK" | "UNPROTECTED";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Compact record for every protected site (sent for the whole estate). */
export interface SiteSummary {
  id: string; // ATC-ABJ-0412
  name: string;
  location: GeoPoint;
  zone: Zone;
  state: string; // Nigerian state
  clusterId: string;
  tenants: Tenant[];
  siteClass: SiteClass;
  status: SiteState;
  riskScore: number; // 0–100, next 72h estimate
  protectionScore: number; // 0–100 site protection health
  protectionState: ProtectionState;
  cctvOnline: boolean;
  backhaul: "primary" | "secondary" | "down";
  nearestTeamId: string;
  nearestTeamEtaMin: number;
  activeIncidentId: string | null;
}

export interface Cluster {
  id: string; // ABJ-C04
  name: string;
  state: string;
  zone: Zone;
  center: GeoPoint;
  responseTeamIds: string[];
}

export type AssetKind = "tower" | "generator" | "battery" | "diesel" | "solar" | "shelter" | "feeder" | "gate" | "cabinet" | "itips";
export type AssetStatus = "healthy" | "warning" | "tamper" | "offline" | "intrusion" | "maintenance";

export interface SiteAsset {
  kind: AssetKind;
  label: string;
  status: AssetStatus;
  detail: string; // e.g. "48V · 16 × 200Ah Li-ion · SOC 78%"
  valueNaira: number;
  lastEvent?: string;
}

export interface Camera {
  id: string; // CAM-ABJ-0412-01
  label: string;
  type: "optical" | "thermal" | "ptz";
  online: boolean;
  fps: number;
  bitrateKbps: number;
  /** Framing hint for the simulated feed */
  view: { mode: "night" | "thermal" | "mono"; panX: number; zoom: number };
}

export type SensorKind =
  | "mmwave_radar" | "pir" | "fence_vibration" | "door_contact" | "gate_contact" | "cabinet_vibration"
  | "battery_movement" | "fuel_level" | "smoke" | "temperature" | "power";

export interface Sensor {
  id: string;
  kind: SensorKind;
  label: string;
  zone: string;
  status: "normal" | "triggered" | "fault" | "offline";
  reading: string;
  lastChange: string; // ISO
}

export interface HealthComponent {
  key: "cctv" | "sensors" | "backhaul" | "edge_ai" | "power" | "storage" | "tamper" | "vms";
  label: string;
  score: number; // 0–100
  status: "ok" | "degraded" | "down";
  detail: string;
}

export interface SiteHealth {
  cameras: { id: string; online: boolean }[];
  jetsonHeartbeatSec: number; // seconds since last heartbeat
  router: "ok" | "degraded" | "down";
  sim1: { carrier: Tenant; signalDbm: number; up: boolean };
  sim2: { carrier: Tenant; signalDbm: number; up: boolean };
  latencyMs: number;
  storageFreePct: number;
  batterySocPct: number;
  solarChargingW: number;
  sensorsHealthyPct: number;
  cabinetTamper: boolean;
  firmware: string;
  firmwareLatest: string;
  vmsConnected: boolean;
  components: HealthComponent[];
  protectionScore: number;
  protectionState: ProtectionState;
}

export interface SiteEvent {
  at: string;
  source: TimelineSource;
  label: string;
  severity: "info" | "warning" | "critical";
}

/** Full Site Security Digital Twin, served per site on demand. */
export interface SiteDetail extends SiteSummary {
  address: string;
  lga: string;
  riskClass: RiskClass;
  towerType: TowerType;
  towerHeightM: number;
  criticalAssets: string[];
  maintenanceContractor: string;
  responseCluster: string;
  nearestTeam: { id: string; callsign: string; distanceKm: number; etaMin: number; status: TeamStatus };
  assets: SiteAsset[];
  cameras: Camera[];
  sensors: Sensor[];
  health: SiteHealth;
  recentEvents: SiteEvent[];
  recentVisits: AccessVisit[];
  incidentHistory: { id: string; at: string; type: IncidentType; outcome: string }[];
  riskFactors: RiskFactor[];
  fusion: FusionAssessment | null;
}

// ── Incidents ─────────────────────────────────────────────────────────────

export type IncidentType = "vandalism" | "battery_theft" | "generator_theft" | "diesel_theft" | "cable_theft" | "solar_theft" | "intrusion" | "sabotage";
export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "detected" | "verified" | "dispatched" | "en_route" | "on_site" | "secured" | "closed";
export type TimelineSource = "radar" | "camera" | "sensor" | "ai" | "deterrent" | "system" | "noc" | "response" | "gps" | "access" | "police";

export interface TimelineEvent {
  at: string;
  source: TimelineSource;
  label: string;
  detail?: string;
}

/** One line of sensor-fusion evidence and how much it moved the confidence. */
export interface FusionSignal {
  source: string; // "Camera 1", "mmWave radar"
  kind: "video" | "sensor" | "access" | "context";
  finding: string; // "Human detected"
  supports: boolean; // supports or argues against intrusion
  weight: number; // contribution in confidence points
  at: string | null;
}

export interface FusionAssessment {
  confidence: number; // 0–100
  verdict: "Probable intrusion" | "Possible intrusion" | "Authorised activity" | "Likely nuisance alarm";
  signals: FusionSignal[];
}

export type TeamStatus = "available" | "assigned" | "en_route" | "on_site" | "unavailable" | "emergency";

export interface ResponseTeam {
  id: string; // RT-ABJ-03
  callsign: string;
  provider: string; // managed response vendor
  clusterId: string;
  state: string;
  status: TeamStatus;
  location: GeoPoint;
  vehicle: { plate: string; type: string };
  crew: { name: string; role: string; armed: boolean }[];
  currentIncidentId: string | null;
  lastGpsFix: string;
}

export const RESPONSE_STAGES = ["alert", "verified", "dispatched", "departed", "arrived", "secured", "closed"] as const;
export type ResponseStage = (typeof RESPONSE_STAGES)[number];

export interface ResponseRecord {
  slaSeconds: number; // ATC armed-response SLA, e.g. 1200
  stages: Partial<Record<ResponseStage, string>>;
  distanceKm: number;
  predictedEtaSec: number | null;
  /** Arrival must be independently verifiable */
  arrivalVerifiedBy: ("gps_geofence" | "geo_checkin" | "access_record" | "cctv")[];
  claimedArrival?: string;
  gpsTrack: GeoPoint[];
  breached: boolean;
  breachReason?: string;
}

export interface Incident {
  id: string; // INC-2026-10482
  type: IncidentType;
  title: string; // "ACTIVE VANDALISM"
  severity: Severity;
  status: IncidentStatus;
  siteId: string;
  siteName: string;
  location: GeoPoint;
  state: string;
  zone: Zone;
  clusterId: string;
  tenant: Tenant;
  detectedAt: string;
  closedAt: string | null;
  fusion: FusionAssessment;
  timeline: TimelineEvent[];
  teamId: string | null;
  response: ResponseRecord;
  evidenceCount: number;
  caseId: string | null;
  campaignId: string | null;
  insiderRisk: boolean;
  vehiclePlates: string[];
  modus: string[]; // entry methods
  targetAsset: AssetKind;
  outcome: "ongoing" | "disrupted" | "theft_completed" | "damage_only" | "false_alarm";
  lossNaira: number;
  recoveredNaira: number;
  downtimeMin: number;
  escalation: { level: number; role: string; name: string; notifiedAt: string | null; acknowledged: boolean }[];
  comms: { at: string; from: string; channel: "radio" | "phone" | "app" | "sms"; text: string }[];
}

// ── Access & insider ──────────────────────────────────────────────────────

export type AccessStatus = "AUTHORIZED" | "OUTSIDE_WINDOW" | "NO_WORK_ORDER" | "SCOPE_EXCEEDED" | "INSIDER_RISK" | "IN_PROGRESS";

export interface AccessVisit {
  id: string;
  person: string;
  employer: string;
  role: string;
  workOrder: string | null;
  siteId: string;
  siteName: string;
  windowStart: string | null;
  windowEnd: string | null;
  arrival: string;
  exit: string | null;
  vehiclePlate: string;
  activities: string[]; // "Opened battery cabinet"
  companions: number; // unknown persons accompanying
  status: AccessStatus;
  flags: InsiderFlag[];
  linkedIncidentId: string | null;
}

export type InsiderFlag =
  | "outside_hours" | "no_work_order" | "repeat_before_theft" | "multi_site_affected" | "vehicle_multi_incident"
  | "unusual_dwell" | "out_of_scope_asset" | "unknown_companions" | "camera_obstructed_after" | "alarm_suppression";

export interface InsiderSubject {
  id: string;
  name: string;
  employer: string;
  kind: "technician" | "contractor" | "vehicle";
  riskScore: number;
  flags: InsiderFlag[];
  visitIds: string[];
  incidentIds: string[];
  summary: string;
}

// ── Intelligence ──────────────────────────────────────────────────────────

export interface Campaign {
  id: string; // V-17
  name: string;
  siteIds: string[];
  incidentIds: string[];
  firstSeen: string;
  lastSeen: string;
  modus: string[];
  targetAssets: AssetKind[];
  timeBand: string; // "01:00–04:00"
  vehicles: string[];
  trend: "expanding" | "stable" | "dormant";
  direction?: string; // "southward"
  confidence: number;
  summary: string;
}

export interface PatternFinding {
  id: string;
  headline: string; // "Same vehicle detected at 4 sites in 9 days"
  kind: "vehicle" | "modus" | "cluster" | "time" | "contractor";
  confidence: number;
  evidence: string[];
  siteIds: string[];
  incidentIds: string[];
  campaignId: string | null;
}

export interface RiskFactor {
  key: string;
  label: string;
  contribution: number; // points of the 0–100 score
  detail: string;
}

export interface RiskForecast {
  siteId: string;
  siteName: string;
  state: string;
  location: GeoPoint;
  score: number;
  band: "Critical" | "High" | "Elevated" | "Moderate" | "Low";
  factors: RiskFactor[];
  recommendations: string[];
}

// ── Cases ─────────────────────────────────────────────────────────────────

export const CASE_STAGES = ["incident", "investigation", "suspect", "arrest", "police_case", "charge", "court", "judgment", "sentence", "asset_recovery", "closed"] as const;
export type CaseStage = (typeof CASE_STAGES)[number];

export interface EvidenceItem {
  id: string;
  kind: "original_footage" | "event_clip" | "still" | "sensor_log" | "ai_classification" | "gps_record" | "access_log" | "bodycam" | "statement" | "recovered_asset";
  title: string;
  capturedAt: string;
  device: string;
  sha256: string;
  verified: boolean;
  custody: { at: string; actor: string; action: string }[];
  preview?: string;
}

export interface CaseFile {
  id: string; // ECF-2026-00412
  incidentId: string;
  siteId: string;
  title: string;
  stage: CaseStage;
  stageDates: Partial<Record<CaseStage, string>>;
  policeRef: string | null;
  court: string | null;
  suspects: { name: string; status: string }[];
  evidence: EvidenceItem[];
  recoveredNaira: number;
  nextAction: string;
  owner: string;
}

// ── Business impact & scorecards ──────────────────────────────────────────

export interface MonthlyImpact {
  month: string; // "2026-05"
  losses: { batteries: number; generators: number; diesel: number; cables: number; solar: number; restoration: number };
  downtimeHours: number;
  intrusionsDetected: number;
  verifiedAttacks: number;
  attacksDisrupted: number;
  recoveredNaira: number;
  avoidedLossNaira: number;
  downtimeAvoidedHours: number;
  incidents: number;
}

export interface Kpi {
  key: string;
  label: string;
  value: number;
  unit: "%" | "count" | "seconds" | "naira" | "hours" | "minutes";
  target?: number;
  /** Change vs previous period, percent (negative = decrease) */
  delta?: number;
  /** For direction-aware colouring */
  betterWhen: "higher" | "lower";
}

export interface OverviewKpis {
  protectedSites: number;
  fullyOperational: number;
  degraded: number;
  offline: number;
  activeAlerts: number;
  criticalIncidents: number;
  teamsDispatched: number;
  respondersOnSite: number;
  resolvedToday: number;
  cctvAvailabilityPct: number;
  connectivityPct: number;
  avgResponseSec: number;
  slaCompliancePct: number;
}

export interface Scorecard {
  security: Kpi[];
  operations: Kpi[];
  financial: Kpi[];
  enforcement: Kpi[];
  /** ATC SOW contractual metrics */
  contract: Kpi[];
}

export interface CaseKpis {
  incidents: number;
  investigations: number;
  arrests: number;
  charged: number;
  activeCourtCases: number;
  convictions: number;
  assetsRecoveredNaira: number;
}

export interface SearchHit {
  kind: "site" | "incident" | "person" | "vehicle" | "contractor" | "case" | "team" | "campaign";
  id: string;
  label: string;
  detail: string;
  link: string;
}

export interface GuardianAnswer {
  question: string;
  answer: string;
  confidence: number;
  results: { id: string; kind: string; label: string; detail: string; link?: string }[];
  provenance: string[];
  engine: "claude" | "built-in";
  caveats: string[];
}

export interface DispatchRecommendation {
  incidentId: string;
  teamId: string;
  callsign: string;
  distanceKm: number;
  etaSeconds: number;
  rationale: string[];
  alternatives: { teamId: string; callsign: string; distanceKm: number; etaSeconds: number; reasonNotTop: string }[];
}

/** Everything the dashboard needs up front: GET /api/ops?r=snapshot */
export interface OpsSnapshot {
  generatedAt: string;
  operatorName: string;
  kpis: OverviewKpis;
  sites: SiteSummary[];
  clusters: Cluster[];
  teams: ResponseTeam[];
  incidents: Incident[];
  visits: AccessVisit[];
  insiderSubjects: InsiderSubject[];
  campaigns: Campaign[];
  patterns: PatternFinding[];
  forecasts: RiskForecast[]; // top-risk sites
  cases: CaseFile[];
  caseKpis: CaseKpis;
  impact: MonthlyImpact[];
  scorecard: Scorecard;
}
