import type { CniiSnapshot, EvidenceItem, GraphEdge, GraphNode, InvestigationCase, Suspect } from "@/lib/cnii";

export const FEATURED_CASE = "NSCDC-CNII-2026-00428";
export const STALE_DAYS = 30;

export const CASE_STATUS_COLOR: Record<InvestigationCase["status"], string> = {
  open: "#22c55e",
  referred: "#06b6d4",
  prosecution: "#a855f7",
  closed: "#64748b",
};

export const CASE_STATUS_LABEL: Record<InvestigationCase["status"], string> = {
  open: "Open",
  referred: "Referred",
  prosecution: "Prosecution",
  closed: "Closed",
};

export function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

/** Open or referred case with no recorded activity for 30+ days. */
export function isStale(c: InvestigationCase, now: number): boolean {
  return (c.status === "open" || c.status === "referred") && daysSince(c.lastActivityAt, now) >= STALE_DAYS;
}

export function suspectLabel(s: Suspect): string {
  if (!s.name) return `Unidentified ("${s.alias}")`;
  return s.alias && s.alias !== "—" ? `${s.name} ("${s.alias}")` : s.name;
}

export interface ProgressStep { label: string; done: boolean; detail: string }

/** Investigation checklist used for the progress indicator. */
export function caseProgress(c: InvestigationCase, evidence: EvidenceItem[], suspects: Suspect[]): ProgressStep[] {
  const intact = evidence.filter((e) => e.hashVerified && e.custodyIntact).length;
  const identified = suspects.filter((s) => s.name).length;
  const witnessesDone = c.witnesses.filter((w) => w.statementTaken).length;
  return [
    { label: "Investigation opened", done: true, detail: "Auto-transitioned from Incident Command" },
    { label: "Evidence secured", done: evidence.length > 0, detail: `${evidence.length} items in vault` },
    { label: "Evidence integrity", done: evidence.length > 0 && intact === evidence.length, detail: `${intact}/${evidence.length} verified & intact` },
    { label: "Suspects identified", done: identified > 0, detail: `${identified}/${suspects.length} identified` },
    { label: "Witness statements", done: witnessesDone === c.witnesses.length, detail: `${witnessesDone}/${c.witnesses.length} taken` },
    { label: "Officer & operator statements", done: c.officerStatements > 0 && c.operatorStatements > 0, detail: `${c.officerStatements} officer · ${c.operatorStatements} operator` },
    { label: "Referred for prosecution", done: c.status !== "open", detail: CASE_STATUS_LABEL[c.status] },
  ];
}

/** Other cases sharing a suspect or vehicle with this case. */
export function linkedCases(c: InvestigationCase, cases: InvestigationCase[]) {
  const sus = new Set(c.suspectIds);
  const veh = new Set(c.vehicleIds);
  return cases
    .filter((o) => o.id !== c.id)
    .map((o) => ({
      c: o,
      sharedSuspects: o.suspectIds.filter((s) => sus.has(s)),
      sharedVehicles: o.vehicleIds.filter((v) => veh.has(v)),
    }))
    .filter((x) => x.sharedSuspects.length || x.sharedVehicles.length);
}

/**
 * The case's investigation graph: everything in the threat graph within two
 * hops of the case, its incidents, suspects and vehicles. When the case has no
 * presence in the threat graph, a small graph is built from its own records.
 * Other cases sharing a suspect/vehicle are added in both modes.
 */
export function caseGraph(c: InvestigationCase, snap: CniiSnapshot): { nodes: GraphNode[]; edges: GraphEdge[]; fromThreatGraph: boolean } {
  const g = snap.graph;
  const nodeIds = new Set(g.nodes.map((n) => n.id));
  const seeds = [c.id, ...c.incidentIds, ...c.suspectIds, ...c.vehicleIds].filter((id) => nodeIds.has(id));

  let nodes: GraphNode[] = [];
  let edges: GraphEdge[] = [];
  const fromThreatGraph = seeds.length > 0;

  if (fromThreatGraph) {
    const reach = new Set(seeds);
    let frontier = new Set(seeds);
    for (let hop = 0; hop < 2; hop++) {
      const next = new Set<string>();
      for (const e of g.edges) {
        if (frontier.has(e.from) && !reach.has(e.to)) next.add(e.to);
        if (frontier.has(e.to) && !reach.has(e.from)) next.add(e.from);
      }
      next.forEach((id) => reach.add(id));
      frontier = next;
    }
    nodes = g.nodes.filter((n) => reach.has(n.id));
    edges = g.edges.filter((e) => reach.has(e.from) && reach.has(e.to));
  } else {
    const add = (n: GraphNode) => { if (!nodes.some((x) => x.id === n.id)) nodes.push(n); };
    add({ id: c.id, kind: "case", label: c.id });
    for (const incId of c.incidentIds) {
      const inc = snap.incidents.find((i) => i.id === incId);
      if (!inc) continue;
      add({ id: inc.id, kind: "incident", label: `${inc.id} · ${inc.operator}`, meta: { operator: inc.operator, date: inc.detectedAt.slice(0, 10) } });
      add({ id: inc.siteId, kind: "site", label: inc.siteName, meta: { operator: inc.operator } });
      edges.push({ from: inc.id, to: c.id, relation: "part of", confidence: 1, source: "Case file" });
      edges.push({ from: inc.id, to: inc.siteId, relation: "occurred at", confidence: 1, source: "ITIPS incident record" });
      for (const sid of inc.suspectIds) edges.push({ from: sid, to: inc.id, relation: "linked to", confidence: 0.8, source: "Incident record" });
      for (const vid of inc.vehicleIds) edges.push({ from: vid, to: inc.id, relation: "present at", confidence: 0.75, source: "Incident record" });
    }
    for (const sid of c.suspectIds) {
      const s = snap.suspects.find((x) => x.id === sid);
      if (s) add({ id: s.id, kind: "person", label: suspectLabel(s), meta: { status: s.status } });
    }
    for (const vid of c.vehicleIds) {
      const v = snap.vehicles.find((x) => x.id === vid);
      if (v) add({ id: v.id, kind: "vehicle", label: v.plate ? `${v.description} ${v.plate}` : v.description });
    }
    for (const aid of c.recoveredAssetIds) {
      const a = snap.stolenAssets.find((x) => x.id === aid);
      if (!a) continue;
      add({ id: a.id, kind: "asset", label: `${a.equipmentType} ${a.serialNumber}`, meta: { value: a.valueNaira, status: a.recoveryStatus } });
      edges.push({ from: a.id, to: a.incidentId, relation: "stolen in", confidence: 1, source: "Stolen asset register" });
      if (a.suspectId) edges.push({ from: a.id, to: a.suspectId, relation: "attributed to", confidence: 0.6, source: "Stolen asset register" });
    }
    const ids = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }

  // Other cases connected through a shared suspect or vehicle
  for (const link of linkedCases(c, snap.cases).slice(0, 6)) {
    if (!nodes.some((n) => n.id === link.c.id)) nodes.push({ id: link.c.id, kind: "case", label: link.c.id, meta: { status: link.c.status } });
    for (const sid of link.sharedSuspects) if (nodes.some((n) => n.id === sid)) edges.push({ from: sid, to: link.c.id, relation: "suspect in", confidence: 1, source: "Case register cross-match" });
    for (const vid of link.sharedVehicles) if (nodes.some((n) => n.id === vid)) edges.push({ from: vid, to: link.c.id, relation: "vehicle in", confidence: 1, source: "Case register cross-match" });
  }
  // De-duplicate edges
  const seen = new Set<string>();
  edges = edges.filter((e) => { const k = `${e.from}|${e.to}|${e.relation}`; if (seen.has(k)) return false; seen.add(k); return true; });
  return { nodes, edges, fromThreatGraph };
}

/** Where a graph node should link to elsewhere in the dashboard. */
export function nodeLink(n: GraphNode): string | null {
  switch (n.kind) {
    case "incident": return `/incident/${n.id}`;
    case "case": return `/investigations/${n.id}`;
    case "asset": return `/assets?focus=${n.id}`;
    case "person": case "phone": case "vehicle": case "dealer": return `/intelligence?focus=${n.id}`;
    case "contractor": return `/insider`;
    default: return null;
  }
}
