/**
 * Shared types for the NSCDC CNII command API.
 *
 * Imported by the serverless handlers (api/*.ts), the Vite dev middleware and
 * the React client, so keep this file dependency-free.
 */

export type Zone = "North-Central" | "North-East" | "North-West" | "South-East" | "South-South" | "South-West";

export type IncidentType =
  | "vandalism"
  | "theft"
  | "armed_intrusion"
  | "cable_theft"
  | "battery_generator_theft"
  | "tower_sabotage";

export type Severity = "critical" | "high" | "medium" | "low";

export type IncidentStatus =
  | "detected"
  | "verified"
  | "dispatched"
  | "en_route"
  | "on_site"
  | "contained"
  | "closed";

export type Operator = "MTN" | "Airtel" | "Glo" | "9mobile" | "IHS Towers" | "American Tower";

export type ModusOperandi =
  | "fence_cutting"
  | "gate_compromise"
  | "impersonation"
  | "insider_assisted"
  | "battery_removal"
  | "generator_theft"
  | "diesel_siphoning"
  | "cable_cutting"
  | "solar_theft"
  | "equipment_substitution";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface StateCommand {
  id: string; // e.g. "SC-FCT"
  state: string;
  zone: Zone;
  capital: string;
  location: GeoPoint;
  areaCommands: AreaCommand[];
}

export interface AreaCommand {
  id: string; // e.g. "AC-FCT-AMAC"
  name: string;
  stateCommandId: string;
  location: GeoPoint;
}

/** NSCDC formation or post shown on the national map. */
export interface Formation {
  id: string;
  name: string;
  kind: "national_hq" | "zonal_command" | "state_command" | "area_command" | "post";
  zone: Zone;
  state: string;
  location: GeoPoint;
}

export type UnitStatus =
  | "available"
  | "standby"
  | "assigned"
  | "en_route"
  | "on_site"
  | "returning"
  | "unavailable";

export interface Officer {
  id: string;
  name: string;
  rank: string;
  serviceNumber: string;
}

export interface ResponseUnit {
  id: string; // e.g. "ABJ-14"
  callsign: string;
  stateCommandId: string;
  areaCommandId: string;
  state: string;
  zone: Zone;
  commander: Officer;
  officers: Officer[];
  vehicle: { plate: string; type: string };
  status: UnitStatus;
  location: GeoPoint;
  currentAssignment: string | null; // incident id
  equipmentReadiness: number; // 0..100
  equipment: { item: string; ok: boolean }[];
  comms: "online" | "degraded" | "offline";
  armed: boolean;
  lastCheckIn: string; // ISO
}

export type TimelineSource = "radar" | "camera" | "sensor" | "ai" | "operator" | "command" | "unit" | "gps" | "investigator";

export interface TimelineEvent {
  at: string; // ISO
  source: TimelineSource;
  label: string;
  detail?: string;
}

/** The nine auditable response stages, in order. */
export const SLA_STAGES = [
  "alert",
  "verification",
  "dispatch",
  "acceptance",
  "departure",
  "en_route",
  "arrival",
  "intervention",
  "closure",
] as const;
export type SlaStage = (typeof SLA_STAGES)[number];

export type ArrivalEvidence = "gps_geofence" | "digital_checkin" | "access_record" | "cctv_confirmation";

export interface ResponseRecord {
  slaSeconds: number; // alert → arrival target
  stages: Partial<Record<SlaStage, string>>; // ISO timestamps
  /** What the unit claimed vs what independent evidence shows. */
  claimedArrival?: string;
  verifiedArrival?: string;
  arrivalEvidence: ArrivalEvidence[];
  breached: boolean;
  breachReason?: string;
  distanceKm: number;
}

export interface Suspect {
  id: string;
  alias: string;
  name: string | null; // null until identified
  status: "unidentified" | "identified" | "wanted" | "arrested" | "charged" | "released";
  description: string;
  armed: boolean;
}

export interface Vehicle {
  id: string;
  plate: string | null;
  description: string;
  seenAt: string[]; // site ids
}

export interface Incident {
  id: string; // INC-2026-00872
  type: IncidentType;
  title: string;
  severity: Severity;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED" | "GUARDED";
  status: IncidentStatus;
  verified: boolean;
  operator: Operator;
  siteId: string;
  siteName: string;
  location: GeoPoint;
  state: string;
  zone: Zone;
  stateCommandId: string;
  areaCommandId: string;
  lga: string;
  detectedAt: string;
  modusOperandi: ModusOperandi[];
  threatSummary: string;
  personsDetected: number;
  weaponSuspected: boolean;
  sensorAlerts: { sensor: string; reading: string; at: string }[];
  stillImages: string[]; // public URLs
  videoFeedApproved: boolean;
  suspectIds: string[];
  vehicleIds: string[];
  respondingUnitId: string | null;
  etaSeconds: number | null;
  route: GeoPoint[]; // unit → site
  timeline: TimelineEvent[];
  response: ResponseRecord;
  arrests: number;
  assetsRecoveredNaira: number;
  caseId: string | null;
}

export type EvidenceKind = "video" | "image" | "sensor_log" | "access_log" | "statement" | "document" | "forensic" | "gps_track";

export interface CustodyEvent {
  at: string;
  actor: string;
  action: "captured" | "ingested" | "hashed" | "viewed" | "exported" | "transferred" | "verified" | "sealed";
  note?: string;
}

export interface EvidenceItem {
  id: string; // EVD-2026-042891
  caseId: string | null;
  incidentId: string;
  kind: EvidenceKind;
  title: string;
  source: string;
  originatingDevice: string;
  capturedAt: string;
  location: GeoPoint;
  sha256: string;
  hashVerified: boolean;
  acquiredBy: string;
  custody: CustodyEvent[];
  exports: { at: string; to: string; by: string }[];
  custodyIntact: boolean;
  preview?: string; // image URL
}

export type CaseStage =
  | "investigation"
  | "arrest"
  | "charge"
  | "prosecution"
  | "hearing"
  | "judgment"
  | "sentence"
  | "appeal"
  | "closed";

export interface InvestigationCase {
  id: string; // NSCDC-CNII-2026-00428
  title: string;
  incidentIds: string[];
  leadInvestigator: string;
  stateCommandId: string;
  state: string;
  openedAt: string;
  lastActivityAt: string;
  status: "open" | "referred" | "prosecution" | "closed";
  suspectIds: string[];
  witnesses: { name: string; role: string; statementTaken: boolean }[];
  vehicleIds: string[];
  evidenceIds: string[];
  recoveredAssetIds: string[];
  operatorStatements: number;
  officerStatements: number;
  notes: string;
}

export interface ProsecutionCase {
  id: string;
  caseId: string;
  stage: CaseStage;
  prosecutor: string;
  court: string;
  charge: string;
  defendants: string[];
  evidenceSubmitted: number;
  filedAt: string;
  nextHearing: string | null;
  adjournments: { at: string; reason: string }[];
  judgment: string | null;
  sentence: string | null;
  recoveredAssetsNaira: number;
}

export type GraphNodeKind = "person" | "phone" | "vehicle" | "contractor" | "site" | "incident" | "asset" | "case" | "dealer" | "tool";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  meta?: Record<string, string | number>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
  confidence: number; // 0..1
  source: string; // provenance
}

export interface StolenAsset {
  id: string;
  equipmentType: "battery" | "generator" | "cable" | "solar_panel" | "rectifier" | "antenna";
  manufacturer: string;
  serialNumber: string;
  operator: Operator;
  siteId: string;
  siteName: string;
  valueNaira: number;
  stolenAt: string;
  incidentId: string;
  trackerLocation: GeoPoint | null;
  recoveryStatus: "missing" | "tracked" | "recovered" | "destroyed";
  recoveryLocation: { name: string; location: GeoPoint } | null;
  recoveredAt: string | null;
  suspectId: string | null;
  receivingDealer: string | null;
}

export interface WorkOrderVisit {
  id: string;
  technician: string;
  contractor: string;
  vehiclePlate: string;
  siteId: string;
  siteName: string;
  operator: Operator;
  visitAt: string;
  workOrder: string | null; // null = no valid work order
  cameraObstructed: boolean;
  assetsTouched: string[];
}

export interface InsiderReferral {
  id: string;
  subject: string; // technician or contractor
  subjectKind: "technician" | "contractor" | "crew";
  riskScore: number; // 0..100
  pattern: string;
  indicators: string[];
  linkedVisitIds: string[];
  linkedIncidentIds: string[];
  status: "flagged" | "under_review" | "referred" | "cleared";
  createdAt: string;
}

export interface ThreatPrediction {
  id: string;
  headline: string;
  region: string;
  kind: "risk_increase" | "reconnaissance" | "cluster_expansion" | "coverage_gap";
  changePct: number | null;
  confidence: number;
  basis: string[];
  recommendations: string[];
  location: GeoPoint;
}

export interface Hotspot {
  id: string;
  name: string;
  location: GeoPoint;
  radiusKm: number;
  incidents90d: number;
  dominantType: IncidentType;
}

export interface Corridor {
  id: string;
  name: string;
  path: GeoPoint[];
  risk: number; // 0..100
  trend: "rising" | "stable" | "falling";
}

export interface RiskCell {
  state: string;
  zone: Zone;
  risk: number; // 0..100
  incidents90d: number;
  byType: Record<IncidentType, number>;
  byHour: number[]; // 24 buckets
  topOperator: Operator;
  topModus: ModusOperandi;
}

export interface ScorecardRow {
  id: string;
  level: "zone" | "state" | "area" | "unit";
  name: string;
  parentId: string | null;
  incidentsAssigned: number;
  ackSeconds: number;
  mobilisationSeconds: number;
  responseSeconds: number;
  slaCompliance: number; // 0..100
  successfulInterventions: number;
  arrests: number;
  recoveriesNaira: number;
  falseDispatches: number;
  evidenceCompleteness: number; // 0..100
  reportCompletion: number; // 0..100
  repeatIncidents: number;
  conductFlags: number;
  /** Weighted: Response 30, Prevention 20, Conduct 15, Evidence 20, Outcomes 15. */
  composite: number;
  pillars: { response: number; prevention: number; conduct: number; evidence: number; outcomes: number };
}

export interface ExecutiveKpis {
  activeIncidents: number;
  criticalIncidents: number;
  teamsDispatched: number;
  teamsOnSite: number;
  avgResponseSeconds: number;
  slaMetPct: number;
  arrestsToday: number;
  assetsRecoveredNairaToday: number;
  openInvestigations: number;
  casesUnderProsecution: number;
  convictionsYtd: number;
}

export interface ProsecutionKpis {
  arrests: number;
  casesFiled: number;
  activeProsecutions: number;
  convictions: number;
  dismissed: number;
  pending: number;
  avgCaseDurationDays: number;
}

export interface DispatchRecommendation {
  incidentId: string;
  unitId: string;
  callsign: string;
  distanceKm: number;
  etaSeconds: number;
  threat: string;
  recommendedSupport: string[];
  rationale: string[];
  alternatives: { unitId: string; callsign: string; distanceKm: number; etaSeconds: number; reasonNotTop: string }[];
}

export interface GuardianAnswer {
  question: string;
  answer: string;
  confidence: number; // 0..1
  results: { id: string; kind: string; label: string; detail: string; link?: string }[];
  provenance: string[];
  engine: "claude" | "built-in";
  caveats: string[];
}

/** Everything the dashboard needs, served by GET /api/cnii?r=snapshot. */
export interface CniiSnapshot {
  generatedAt: string;
  kpis: ExecutiveKpis;
  stateCommands: StateCommand[];
  formations: Formation[];
  units: ResponseUnit[];
  incidents: Incident[];
  suspects: Suspect[];
  vehicles: Vehicle[];
  evidence: EvidenceItem[];
  cases: InvestigationCase[];
  prosecutions: ProsecutionCase[];
  prosecutionKpis: ProsecutionKpis;
  stolenAssets: StolenAsset[];
  visits: WorkOrderVisit[];
  insiderReferrals: InsiderReferral[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  hotspots: Hotspot[];
  corridors: Corridor[];
  riskCells: RiskCell[];
  predictions: ThreatPrediction[];
  scorecards: ScorecardRow[];
}
