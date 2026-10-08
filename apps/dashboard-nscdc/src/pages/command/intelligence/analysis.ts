import type { CniiSnapshot, GraphEdge, GraphNode, Incident, ModusOperandi, Operator } from "@/lib/cnii";

/**
 * id → incident, keeping the FIRST record for an id (matches useCnii().incident()).
 * Guards against duplicate ids in the feed.
 */
export function indexIncidents(incidents: Incident[]): Map<string, Incident> {
  const m = new Map<string, Incident>();
  for (const i of incidents) if (!m.has(i.id)) m.set(i.id, i);
  return m;
}

export const OPERATORS: Operator[] = ["MTN", "Airtel", "Glo", "9mobile", "IHS Towers", "American Tower"];

export const MODUS_ORDER: ModusOperandi[] = [
  "fence_cutting", "gate_compromise", "impersonation", "insider_assisted", "battery_removal",
  "generator_theft", "diesel_siphoning", "cable_cutting", "solar_theft", "equipment_substitution",
];

/** "Mon 28 Sep" in West Africa Time */
export function fmtDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short" }).replace(",", "");
}

export interface NetworkCorrelation {
  id: string;
  persons: { id: string; label: string }[];
  incidents: Incident[]; // chronological
  operators: Operator[];
  vehicleIds: string[];
  /** Weakest graph link that supports the cluster (1 if only incident records) */
  minConfidence: number;
  sources: string[];
}

/**
 * Group persons (suspects + graph person nodes) that share incidents, then keep
 * clusters whose incidents span more than one operator: a "potentially same
 * network" correlation that individual operator systems would see as unrelated.
 */
export function detectNetworks(snap: CniiSnapshot): NetworkCorrelation[] {
  const incById = indexIncidents(snap.incidents);
  const personLinks = new Map<string, Map<string, { confidence: number; source: string }>>();
  const link = (pid: string, iid: string, confidence: number, source: string) => {
    if (!incById.has(iid)) return;
    const m = personLinks.get(pid) ?? new Map();
    const prev = m.get(iid);
    if (!prev || prev.confidence < confidence) m.set(iid, { confidence, source });
    personLinks.set(pid, m);
  };
  for (const inc of snap.incidents) for (const sid of inc.suspectIds) link(sid, inc.id, 1, "ITIPS incident record");
  const personIds = new Set([...snap.suspects.map((s) => s.id), ...snap.graph.nodes.filter((n) => n.kind === "person").map((n) => n.id)]);
  for (const e of snap.graph.edges) {
    if (personIds.has(e.from)) link(e.from, e.to, e.confidence, e.source);
    if (personIds.has(e.to)) link(e.to, e.from, e.confidence, e.source);
  }

  // Union-find over persons sharing an incident
  const parent = new Map<string, string>();
  const find = (x: string): string => { const p = parent.get(x) ?? x; if (p === x) return x; const r = find(p); parent.set(x, r); return r; };
  const owner = new Map<string, string>();
  for (const [pid, incs] of personLinks) {
    parent.set(pid, parent.get(pid) ?? pid);
    for (const iid of incs.keys()) {
      const o = owner.get(iid);
      if (o) parent.set(find(pid), find(o)); else owner.set(iid, pid);
    }
  }
  const clusters = new Map<string, string[]>();
  for (const pid of personLinks.keys()) { const r = find(pid); clusters.set(r, [...(clusters.get(r) ?? []), pid]); }

  const labelOf = (pid: string) => {
    const g = snap.graph.nodes.find((n) => n.id === pid);
    if (g) return g.label;
    const s = snap.suspects.find((x) => x.id === pid);
    return s ? (s.name ? `${s.name}${s.alias !== "—" ? ` ("${s.alias}")` : ""}` : `Unidentified ("${s.alias}")`) : pid;
  };

  const out: NetworkCorrelation[] = [];
  for (const members of clusters.values()) {
    const links = members.flatMap((pid) => [...personLinks.get(pid)!.entries()]);
    const incidents = [...new Set(links.map(([iid]) => iid))].map((iid) => incById.get(iid)!).sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
    const operators = [...new Set(incidents.map((i) => i.operator))];
    if (operators.length < 2) continue;
    out.push({
      id: members.sort()[0],
      persons: members.map((id) => ({ id, label: labelOf(id) })),
      incidents,
      operators,
      vehicleIds: [...new Set(incidents.flatMap((i) => i.vehicleIds))],
      minConfidence: Math.min(...links.map(([, l]) => l.confidence)),
      sources: [...new Set(links.map(([, l]) => l.source))],
    });
  }
  return out.sort((a, b) => b.operators.length - a.operators.length || b.incidents.length - a.incidents.length);
}

/** Nodes within `depth` hops of `id`, using only edges at/above minConfidence. */
export function neighbourhood(id: string, edges: GraphEdge[], depth: number): Set<string> {
  const seen = new Set([id]);
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const e of edges) {
      for (const [a, b] of [[e.from, e.to], [e.to, e.from]] as const) {
        if (frontier.includes(a) && !seen.has(b)) { seen.add(b); next.push(b); }
      }
    }
    frontier = next;
  }
  return seen;
}

export function moMatrix(incidents: Incident[]) {
  const m = new Map<ModusOperandi, Record<Operator, number>>();
  for (const mo of MODUS_ORDER) m.set(mo, Object.fromEntries(OPERATORS.map((o) => [o, 0])) as Record<Operator, number>);
  for (const i of incidents) for (const mo of i.modusOperandi) m.get(mo)![i.operator] += 1;
  return m;
}

/** Weekly counts of each MO for the last `weeks` weeks ending at `nowIso`. */
export function moTrend(incidents: Incident[], nowIso: string, weeks = 12) {
  const now = new Date(nowIso).getTime();
  const W = 7 * 86400_000;
  const rows = Array.from({ length: weeks }, (_, k) => {
    const end = now - (weeks - 1 - k) * W;
    const row: Record<string, number | string> = { week: new Date(end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Africa/Lagos" }) };
    for (const mo of MODUS_ORDER) row[mo] = 0;
    return row;
  });
  for (const i of incidents) {
    const k = weeks - 1 - Math.floor((now - new Date(i.detectedAt).getTime()) / W);
    if (k < 0 || k >= weeks) continue;
    for (const mo of i.modusOperandi) (rows[k][mo] as number) += 1;
  }
  return rows;
}

export function nodeLink(node: GraphNode): string | null {
  if (node.kind === "incident") return `/incident/${node.id}`;
  if (node.kind === "case") return `/investigations/${node.id}`;
  if (node.kind === "contractor") return "/insider";
  if (node.kind === "asset" || node.kind === "dealer") return "/assets";
  return null;
}
