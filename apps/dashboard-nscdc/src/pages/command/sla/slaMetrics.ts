import { secondsBetween, type ArrivalEvidence, type Incident, type SlaStage } from "@/lib/cnii";

export const STAGE_LABEL: Record<SlaStage, string> = {
  alert: "Alert",
  verification: "Verification",
  dispatch: "Dispatch",
  acceptance: "Acceptance",
  departure: "Departure",
  en_route: "En route",
  arrival: "Arrival",
  intervention: "Intervention",
  closure: "Closure",
};

export const EVIDENCE_LABEL: Record<ArrivalEvidence, string> = {
  gps_geofence: "GPS geofence",
  digital_checkin: "Digital check-in",
  access_record: "Access record",
  cctv_confirmation: "CCTV",
};

export interface ResponseMetrics {
  dispatchLatency: number | null; // alert → dispatch
  turnout: number | null; // dispatch → departure
  travel: number | null; // departure → arrival
  arrival: number | null; // alert → arrival
  intervention: number | null; // arrival → intervention
  total: number | null; // alert → closure (or intervention while open)
}

/** Verified arrival (independent evidence) falls back to the stage timestamp. */
export const arrivalAt = (inc: Incident) => inc.response.verifiedArrival ?? inc.response.stages.arrival;

export function metricsFor(inc: Incident): ResponseMetrics {
  const s = inc.response.stages;
  const arr = arrivalAt(inc);
  return {
    dispatchLatency: secondsBetween(s.alert, s.dispatch),
    turnout: secondsBetween(s.dispatch, s.departure),
    travel: secondsBetween(s.departure, arr),
    arrival: secondsBetween(s.alert, arr),
    intervention: secondsBetween(arr, s.intervention),
    total: secondsBetween(s.alert, s.closure ?? s.intervention),
  };
}

export interface Discrepancy {
  claimedSec: number;
  verifiedSec: number;
  gapSec: number;
  verifiedBy: string;
}

/** Claimed vs independently verified arrival (only when they differ by > 1 min). */
export function discrepancyFor(inc: Incident): Discrepancy | null {
  const { claimedArrival, verifiedArrival, stages, arrivalEvidence } = inc.response;
  if (!claimedArrival || !verifiedArrival) return null;
  const alert = stages.alert ?? inc.detectedAt;
  const claimedSec = secondsBetween(alert, claimedArrival) ?? 0;
  const verifiedSec = secondsBetween(alert, verifiedArrival) ?? 0;
  const gapSec = verifiedSec - claimedSec;
  if (Math.abs(gapSec) < 60) return null;
  const verifiedBy = arrivalEvidence.includes("gps_geofence") ? "GPS geofence" : arrivalEvidence[0] ? EVIDENCE_LABEL[arrivalEvidence[0]] : "independent evidence";
  return { claimedSec, verifiedSec, gapSec, verifiedBy };
}

/** Arrival recorded but not backed by any independent evidence. */
export const unverifiedArrival = (inc: Incident) => !!arrivalAt(inc) && inc.response.arrivalEvidence.length === 0;

export const median = (xs: number[]) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export const mins = (sec: number) => Math.round(sec / 60);
