import type { ResponseUnit, ScorecardRow } from "@/lib/cnii";

export const NATIONAL_ID = "NATIONAL";

export type Pillar = keyof ScorecardRow["pillars"];

/** The composite weighting — kept in one place so the explainer and the maths agree. */
export const PILLARS: { key: Pillar; label: string; weight: number; color: string; measures: string }[] = [
  { key: "response", label: "Response", weight: 0.3, color: "#22c55e", measures: "SLA compliance and alert → arrival time" },
  { key: "prevention", label: "Prevention", weight: 0.2, color: "#06b6d4", measures: "Fewer repeat incidents and false dispatches" },
  { key: "conduct", label: "Professional Conduct", weight: 0.15, color: "#a855f7", measures: "Conduct flags, complaints, discipline" },
  { key: "evidence", label: "Evidence Quality", weight: 0.2, color: "#f59e0b", measures: "Evidence completeness and report completion" },
  { key: "outcomes", label: "Case Outcomes", weight: 0.15, color: "#3b82f6", measures: "Cases opened, interventions, lawful arrests (capped)" },
];

export const LEVEL_LABEL: Record<ScorecardRow["level"] | "national", string> = {
  national: "National",
  zone: "Zonal Command",
  state: "State Command",
  area: "Area Command",
  unit: "Unit / Team",
};

export type FormationRow = Omit<ScorecardRow, "level"> & { level: ScorecardRow["level"] | "national" };

export function compositeOf(p: ScorecardRow["pillars"]): number {
  return Math.round(PILLARS.reduce((s, x) => s + p[x.key] * x.weight, 0));
}

/** National roll-up from zone rows, using the same aggregation as the server. */
export function nationalRollup(zones: ScorecardRow[]): FormationRow {
  const n = zones.length || 1;
  const weightOf = (x: ScorecardRow) => Math.max(1, x.incidentsAssigned);
  const totalW = Math.max(1, zones.reduce((s, x) => s + weightOf(x), 0));
  const wavg = (f: (x: ScorecardRow) => number) => Math.round(zones.reduce((s, x) => s + f(x) * weightOf(x), 0) / totalW);
  const sum = (f: (x: ScorecardRow) => number) => zones.reduce((s, x) => s + f(x), 0);
  const avgP = (k: Pillar) => Math.round(sum((x) => x.pillars[k]) / n);
  const pillars = { response: avgP("response"), prevention: avgP("prevention"), conduct: avgP("conduct"), evidence: avgP("evidence"), outcomes: avgP("outcomes") };
  return {
    id: NATIONAL_ID,
    level: "national",
    name: "NSCDC National HQ",
    parentId: null,
    incidentsAssigned: sum((x) => x.incidentsAssigned),
    ackSeconds: wavg((x) => x.ackSeconds),
    mobilisationSeconds: wavg((x) => x.mobilisationSeconds),
    responseSeconds: wavg((x) => x.responseSeconds),
    slaCompliance: Math.round((sum((x) => x.slaCompliance) / n) * 10) / 10,
    successfulInterventions: sum((x) => x.successfulInterventions),
    arrests: sum((x) => x.arrests),
    recoveriesNaira: sum((x) => x.recoveriesNaira),
    falseDispatches: sum((x) => x.falseDispatches),
    evidenceCompleteness: wavg((x) => x.evidenceCompleteness),
    reportCompletion: wavg((x) => x.reportCompletion),
    repeatIncidents: sum((x) => x.repeatIncidents),
    conductFlags: sum((x) => x.conductFlags),
    composite: compositeOf(pillars),
    pillars,
  };
}

export interface ScoreTree {
  byId: Map<string, FormationRow>;
  children: (id: string) => FormationRow[];
  /** Root → … → id */
  path: (id: string) => FormationRow[];
  /** All unit rows below (or equal to) a formation */
  unitsUnder: (id: string) => FormationRow[];
}

export function buildTree(rows: ScorecardRow[]): ScoreTree {
  const national = nationalRollup(rows.filter((r) => r.level === "zone"));
  const all: FormationRow[] = [national, ...rows];
  const byId = new Map(all.map((r) => [r.id, r]));
  const kids = new Map<string, FormationRow[]>();
  for (const r of rows) {
    const parent = r.level === "zone" ? NATIONAL_ID : r.parentId;
    if (!parent) continue;
    kids.set(parent, [...(kids.get(parent) ?? []), r]);
  }
  const children = (id: string) => kids.get(id) ?? [];
  const path = (id: string) => {
    const out: FormationRow[] = [];
    let cur = byId.get(id);
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      out.unshift(cur);
      cur = cur.level === "zone" ? national : cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return out;
  };
  const unitsUnder = (id: string): FormationRow[] => {
    const self = byId.get(id);
    if (self?.level === "unit") return [self];
    return children(id).flatMap((c) => unitsUnder(c.id));
  };
  return { byId, children, path, unitsUnder };
}

/** Officers of a response unit — the "team" level below a unit scorecard. */
export function teamOf(units: ResponseUnit[], unitId: string): ResponseUnit | undefined {
  return units.find((u) => u.id === unitId);
}

export function compositeColor(v: number): string {
  if (v >= 80) return "#22c55e";
  if (v >= 70) return "#84cc16";
  if (v >= 60) return "#eab308";
  return "#ef4444";
}
