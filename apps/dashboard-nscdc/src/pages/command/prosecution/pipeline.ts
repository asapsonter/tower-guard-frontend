import type { CaseStage, CniiSnapshot, ProsecutionCase } from "@/lib/cnii";

/** Court-side stage order (a prosecution file starts at charge). */
export const COURT_STAGES: CaseStage[] = ["charge", "prosecution", "hearing", "judgment", "sentence", "appeal", "closed"];
export const stageIndex = (s: CaseStage) => COURT_STAGES.indexOf(s);

export const STAGE_COLOR: Record<CaseStage, string> = {
  investigation: "#94a3b8", arrest: "#f97316", charge: "#eab308", prosecution: "#3b82f6", hearing: "#06b6d4",
  judgment: "#a855f7", sentence: "#22c55e", appeal: "#ec4899", closed: "#64748b",
};

export interface FunnelStep {
  key: string;
  label: string;
  reached: number;
  current: number | null;
  hint?: string;
  /** Branch steps are not a strict subset of the previous step */
  branch?: boolean;
}

export function buildFunnel(snap: CniiSnapshot): FunnelStep[] {
  const pros = snap.prosecutions;
  const prosByCase = new Set(pros.map((p) => p.caseId));
  const incById = new Map(snap.incidents.map((i) => [i.id, i]));
  const susById = new Map(snap.suspects.map((s) => [s.id, s]));
  const legacy = snap.cases.filter((c) => c.incidentIds.length === 0).length;
  const arrested = snap.cases.filter((c) =>
    prosByCase.has(c.id)
    || c.incidentIds.some((id) => (incById.get(id)?.arrests ?? 0) > 0)
    || c.suspectIds.some((id) => ["arrested", "charged"].includes(susById.get(id)?.status ?? "")));
  const atLeast = (s: CaseStage) => pros.filter((p) => stageIndex(p.stage) >= stageIndex(s)).length;
  const at = (s: CaseStage) => pros.filter((p) => p.stage === s).length;

  return [
    { key: "incident", label: "Incident", reached: snap.incidents.length + legacy, current: null, hint: legacy ? `incl. ${legacy} pre-window` : undefined },
    { key: "investigation", label: "Investigation", reached: snap.cases.length, current: snap.cases.filter((c) => c.status === "open" || c.status === "referred").length },
    { key: "arrest", label: "Arrest", reached: arrested.length, current: arrested.filter((c) => !prosByCase.has(c.id)).length },
    { key: "charge", label: "Charge", reached: pros.length, current: at("charge") },
    { key: "prosecution", label: "Prosecution", reached: atLeast("prosecution"), current: at("prosecution") },
    { key: "hearing", label: "Hearing", reached: atLeast("hearing"), current: at("hearing") },
    { key: "judgment", label: "Judgment", reached: pros.filter((p) => p.judgment).length, current: at("judgment"), hint: `${pros.filter((p) => p.judgment === "Reserved").length} reserved` },
    { key: "sentence", label: "Sentence", reached: pros.filter((p) => p.sentence).length, current: at("sentence") },
    { key: "appeal", label: "Appeal", reached: at("appeal"), current: at("appeal"), branch: true },
    { key: "closure", label: "Closure", reached: at("closed"), current: at("closed"), branch: true },
  ];
}

export function adjournmentReasons(pros: ProsecutionCase[]) {
  const m = new Map<string, number>();
  for (const p of pros) for (const a of p.adjournments) m.set(a.reason, (m.get(a.reason) ?? 0) + 1);
  return [...m.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400_000);
}
