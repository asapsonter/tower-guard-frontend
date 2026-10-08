import type { AccessVisit, GraphEdge, GraphNode, Incident } from "@/lib/ops";

export const OUTCOME_COLOR: Record<Incident["outcome"], string> = {
  ongoing: "#ef4444", disrupted: "#22c55e", theft_completed: "#f97316", damage_only: "#eab308", false_alarm: "#64748b",
};
export const OUTCOME_LABEL: Record<Incident["outcome"], string> = {
  ongoing: "Ongoing", disrupted: "Disrupted", theft_completed: "Theft completed", damage_only: "Damage only", false_alarm: "False alarm",
};

/**
 * Relationship graph for a set of incidents: incidents ↔ sites ↔ vehicles ↔
 * contractors (and their technicians, from visits linked to those incidents).
 */
export function buildCampaignGraph(incidents: Incident[], visits: AccessVisit[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const add = (n: GraphNode) => { if (!nodes.has(n.id)) nodes.set(n.id, n); };
  const ids = new Set(incidents.map((i) => i.id));

  for (const inc of incidents) {
    add({ id: `inc:${inc.id}`, kind: "incident", label: inc.id });
    add({ id: `site:${inc.siteId}`, kind: "site", label: inc.siteId });
    edges.push({ from: `inc:${inc.id}`, to: `site:${inc.siteId}`, relation: "occurred at", confidence: 1, source: "Incident record" });
    for (const p of inc.vehiclePlates) {
      add({ id: `veh:${p}`, kind: "vehicle", label: p });
      edges.push({ from: `veh:${p}`, to: `inc:${inc.id}`, relation: "seen near", confidence: 0.86, source: "ANPR + site CCTV" });
    }
  }
  for (const v of visits) {
    if (!v.linkedIncidentId || !ids.has(v.linkedIncidentId)) continue;
    const c = `con:${v.employer}`;
    const p = `per:${v.person}`;
    add({ id: c, kind: "contractor", label: v.employer });
    add({ id: p, kind: "person", label: v.person });
    add({ id: `veh:${v.vehiclePlate}`, kind: "vehicle", label: v.vehiclePlate });
    add({ id: `site:${v.siteId}`, kind: "site", label: v.siteId });
    edges.push({ from: p, to: c, relation: "employed by", confidence: 0.95, source: "Contractor register" });
    edges.push({ from: p, to: `site:${v.siteId}`, relation: "visited", confidence: 0.9, source: `Access log ${v.id}` });
    edges.push({ from: p, to: `veh:${v.vehiclePlate}`, relation: "drove", confidence: 0.8, source: `Access log ${v.id}` });
    edges.push({ from: c, to: `inc:${v.linkedIncidentId}`, relation: "visit before", confidence: 0.62, source: "Temporal correlation" });
  }
  // de-duplicate edges
  const seen = new Set<string>();
  const unique = edges.filter((e) => { const k = `${e.from}|${e.to}|${e.relation}`; if (seen.has(k)) return false; seen.add(k); return true; });
  return { nodes: [...nodes.values()], edges: unique };
}
