import type { CniiSnapshot, Incident, InsiderReferral, WorkOrderVisit } from "@/lib/cnii";

/** Window after a visit in which a site incident is considered correlated. */
export const CORRELATION_WINDOW_H = 72;

export interface VisitLink {
  visit: WorkOrderVisit;
  incident: Incident | null;
  gapHours: number | null;
}

export function incidentsBySite(snap: CniiSnapshot): Map<string, Incident[]> {
  const m = new Map<string, Incident[]>();
  for (const i of snap.incidents) m.set(i.siteId, [...(m.get(i.siteId) ?? []), i]);
  for (const list of m.values()) list.sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
  return m;
}

/** First incident at the visited site after the visit (preferring the referral's linked incidents). */
export function followingIncident(visit: WorkOrderVisit, bySite: Map<string, Incident[]>, preferIds: string[] = []): VisitLink {
  const vt = new Date(visit.visitAt).getTime();
  const after = (bySite.get(visit.siteId) ?? []).filter((i) => new Date(i.detectedAt).getTime() > vt);
  const inc = after.find((i) => preferIds.includes(i.id))
    ?? after.find((i) => new Date(i.detectedAt).getTime() - vt <= CORRELATION_WINDOW_H * 3600_000)
    ?? null;
  return { visit, incident: inc, gapHours: inc ? (new Date(inc.detectedAt).getTime() - vt) / 3600_000 : null };
}

export function referralLinks(ref: InsiderReferral, snap: CniiSnapshot, bySite: Map<string, Incident[]>): VisitLink[] {
  return ref.linkedVisitIds
    .map((id) => snap.visits.find((v) => v.id === id))
    .filter((v): v is WorkOrderVisit => !!v)
    .sort((a, b) => a.visitAt.localeCompare(b.visitAt))
    .map((v) => followingIncident(v, bySite, ref.linkedIncidentIds));
}

/** Other visits by the same contractor / technician / vehicle not already in the referral. */
export function otherSites(ref: InsiderReferral, links: VisitLink[], snap: CniiSnapshot, bySite: Map<string, Incident[]>): VisitLink[] {
  const linked = new Set(ref.linkedVisitIds);
  const contractors = new Set(links.map((l) => l.visit.contractor));
  const techs = new Set(links.map((l) => l.visit.technician));
  const plates = new Set(links.map((l) => l.visit.vehiclePlate));
  return snap.visits
    .filter((v) => !linked.has(v.id) && (plates.has(v.vehiclePlate) || techs.has(v.technician) || (ref.subjectKind === "contractor" && contractors.has(v.contractor))))
    .sort((a, b) => b.visitAt.localeCompare(a.visitAt))
    .map((v) => followingIncident(v, bySite));
}

export type DecisionAction = "open_investigation" | "request_info" | "clear";

export const DECISION_LABEL: Record<DecisionAction, string> = {
  open_investigation: "Open investigation",
  request_info: "Request more information",
  clear: "Clear — no further action",
};

export const DECISION_COLOR: Record<DecisionAction, string> = {
  open_investigation: "#f97316",
  request_info: "#3b82f6",
  clear: "#22c55e",
};

export interface Decision {
  referralId: string;
  action: DecisionAction;
  officer: string;
  note: string;
  at: string;
}

const KEY = "nscdc.insider.decisions.v1";

export function loadDecisions(): Decision[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Decision[]) : [];
  } catch {
    return [];
  }
}

export function saveDecisions(list: Decision[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable — keep in memory */ }
}
