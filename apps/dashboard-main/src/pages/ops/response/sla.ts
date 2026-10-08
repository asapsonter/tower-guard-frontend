/**
 * Response-SLA helpers shared by the Response Command and Incident Command
 * workspaces. The operator SLA is 20:00 from alert to *verified* arrival.
 */
import type { GeoPoint, Incident, ResponseRecord, ResponseTeam } from "@/lib/ops";

export const isActive = (i: Incident) => i.status !== "closed";
export const awaitingDispatch = (i: Incident) => (i.status === "detected" || i.status === "verified") && !i.teamId;

export const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;
export const sortActive = (list: Incident[]) =>
  [...list].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.detectedAt.localeCompare(a.detectedAt));

export type SlaTone = "green" | "amber" | "red" | "breached" | "met" | "missed" | "na";
export const SLA_TONE_COLOR: Record<SlaTone, string> = {
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", breached: "#ef4444", met: "#22c55e", missed: "#ef4444", na: "#64748b",
};
export const SLA_TONE_LABEL: Record<SlaTone, string> = {
  green: "On track", amber: "At risk", red: "Critical", breached: "SLA breached", met: "SLA met", missed: "SLA missed", na: "No response required",
};

export interface SlaState {
  tone: SlaTone;
  /** Seconds left (negative when overdue). For a completed response: SLA minus time taken. */
  remaining: number;
  elapsed: number;
  /** True once arrival is verified — the clock stops. */
  frozen: boolean;
}

export function slaState(inc: Incident, now: number): SlaState {
  const sla = inc.response.slaSeconds;
  const start = Date.parse(inc.response.stages.alert ?? inc.detectedAt);
  const arrived = inc.response.stages.arrived;
  if (arrived) {
    const took = (Date.parse(arrived) - start) / 1000;
    return { tone: took <= sla ? "met" : "missed", remaining: sla - took, elapsed: took, frozen: true };
  }
  if (inc.status === "closed") return { tone: "na", remaining: 0, elapsed: 0, frozen: true };
  const elapsed = (now - start) / 1000;
  const remaining = sla - elapsed;
  const tone: SlaTone = remaining < 0 ? "breached" : remaining <= sla * 0.25 ? "red" : remaining <= sla * 0.5 ? "amber" : "green";
  return { tone, remaining, elapsed, frozen: false };
}

/** Baseline for the predicted ETA: the snapshot time, or a dispatch approved after it. */
function etaBase(inc: Incident, generatedAt: string): number {
  const gen = Date.parse(generatedAt);
  const disp = inc.response.stages.dispatched ? Date.parse(inc.response.stages.dispatched) : gen;
  return Math.max(gen, disp);
}

/** Live responder ETA countdown in seconds (null when arrived or no prediction). */
export function etaRemaining(inc: Incident, now: number, generatedAt: string): number | null {
  if (inc.response.stages.arrived || inc.response.predictedEtaSec == null) return null;
  return inc.response.predictedEtaSec - (now - etaBase(inc, generatedAt)) / 1000;
}

/** Team position, advanced along the approach for an en-route team. */
export function liveTeamPosition(inc: Incident | undefined, team: ResponseTeam, now: number, generatedAt: string): GeoPoint {
  if (!inc || team.status !== "en_route" || !inc.response.predictedEtaSec || inc.response.stages.arrived) return team.location;
  const f = Math.min(0.97, Math.max(0, (now - etaBase(inc, generatedAt)) / 1000 / inc.response.predictedEtaSec));
  return {
    lat: team.location.lat + (inc.location.lat - team.location.lat) * f,
    lng: team.location.lng + (inc.location.lng - team.location.lng) * f,
  };
}

export type VerifySource = ResponseRecord["arrivalVerifiedBy"][number];
export const VERIFY_SOURCES: VerifySource[] = ["gps_geofence", "geo_checkin", "access_record", "cctv"];
export const VERIFY_LABEL: Record<VerifySource, string> = {
  gps_geofence: "GPS geofence", geo_checkin: "Geo-tagged check-in", access_record: "Access record", cctv: "CCTV",
};

/** Minutes between a team's claimed arrival and the independently verified one. */
export function claimGapMin(r: ResponseRecord): number | null {
  if (!r.claimedArrival || !r.stages.arrived) return null;
  return Math.round((Date.parse(r.stages.arrived) - Date.parse(r.claimedArrival)) / 60000);
}

/** Group free-text breach reasons into stable buckets. */
export function breachBucket(reason: string | undefined): string {
  if (!reason) return "Unspecified";
  if (reason.startsWith("Team-reported arrival")) return "Claimed arrival not verified";
  return reason;
}
