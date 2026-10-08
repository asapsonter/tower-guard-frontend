import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Car, ChevronRight, Fingerprint, GitBranch, Layers, Network, Scale, Users } from "lucide-react";
import type { GraphNodeKind, ModusOperandi, Operator } from "@/lib/cnii";
import { GRAPH_KIND_COLOR, fmtDate, useCnii } from "@/lib/cnii";
import { PageHeader, Panel } from "@/components/cnii/Panel";
import { KpiTile } from "@/components/cnii/KpiTile";
import { Pill } from "@/components/cnii/Pill";
import { RelationshipGraph } from "@/components/cnii/RelationshipGraph";
import { detectNetworks, fmtDayShort, indexIncidents, neighbourhood, type NetworkCorrelation } from "./intelligence/analysis";
import { NodeDetail } from "./intelligence/NodeDetail";
import { ModusHeatmap, ModusTrend } from "./intelligence/ModusPanels";

const ALL_KINDS: GraphNodeKind[] = ["person", "phone", "vehicle", "contractor", "tool", "asset", "site", "incident", "dealer", "case"];
const KIND_LABEL: Record<GraphNodeKind, string> = {
  person: "Suspects", phone: "Phone IDs", vehicle: "Vehicles", contractor: "Contractors", tool: "Tools", asset: "Stolen equipment",
  site: "Locations", incident: "Incidents", dealer: "Buyers / recyclers", case: "Cases / prosecution",
};
const OPERATOR_COLOR: Record<Operator, string> = {
  MTN: "#facc15", Airtel: "#ef4444", Glo: "#22c55e", "9mobile": "#84cc16", "IHS Towers": "#3b82f6", "American Tower": "#a855f7",
};
const SUSPECT_STATUS_COLOR: Record<string, string> = {
  unidentified: "#94a3b8", identified: "#3b82f6", wanted: "#f97316", arrested: "#ef4444", charged: "#a855f7", released: "#22c55e",
};

export default function Intelligence() {
  const { snap } = useCnii();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const focusParam = params.get("focus");
  const [selectedId, setSelectedId] = useState<string | null>(focusParam);
  const [kinds, setKinds] = useState<Set<GraphNodeKind>>(new Set(ALL_KINDS));
  const [minConf, setMinConf] = useState(0.5);
  const [depth, setDepth] = useState(2);
  const [mo, setMo] = useState<ModusOperandi | null>(null);

  useEffect(() => { if (focusParam) setSelectedId(focusParam); }, [focusParam]);

  const networks = useMemo(() => (snap ? detectNetworks(snap) : []), [snap]);

  const strongEdges = useMemo(() => (snap ? snap.graph.edges.filter((e) => e.confidence >= minConf) : []), [snap, minConf]);
  const graphNodes = useMemo(() => {
    if (!snap) return [];
    let list = snap.graph.nodes.filter((n) => kinds.has(n.kind) || n.id === focusParam);
    if (focusParam && list.some((n) => n.id === focusParam)) {
      const ids = new Set(list.map((n) => n.id));
      const keep = neighbourhood(focusParam, strongEdges.filter((e) => ids.has(e.from) && ids.has(e.to)), depth);
      list = list.filter((n) => keep.has(n.id));
    }
    return list;
  }, [snap, kinds, focusParam, strongEdges, depth]);

  const suspectRows = useMemo(() => {
    if (!snap) return [];
    const incById = indexIncidents(snap.incidents);
    return snap.suspects.map((s) => {
      const ids = new Set(snap.incidents.filter((i) => i.suspectIds.includes(s.id)).map((i) => i.id));
      snap.graph.edges.forEach((e) => { if (e.from === s.id && incById.has(e.to)) ids.add(e.to); if (e.to === s.id && incById.has(e.from)) ids.add(e.from); });
      const incs = [...ids].map((id) => incById.get(id)!).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
      return { s, incs, operators: [...new Set(incs.map((i) => i.operator))], inGraph: snap.graph.nodes.some((n) => n.id === s.id) };
    }).filter((r) => r.incs.length || r.inGraph)
      .sort((a, b) => b.operators.length - a.operators.length || b.incs.length - a.incs.length);
  }, [snap]);

  const vehicleRows = useMemo(() => {
    if (!snap) return [];
    return snap.vehicles.map((v) => {
      const incs = snap.incidents.filter((i) => i.vehicleIds.includes(v.id));
      return { v, incs, operators: [...new Set(incs.map((i) => i.operator))], inGraph: snap.graph.nodes.some((n) => n.id === v.id) };
    }).filter((r) => r.incs.length || r.inGraph || r.v.seenAt.length)
      .sort((a, b) => b.v.seenAt.length - a.v.seenAt.length || b.incs.length - a.incs.length);
  }, [snap]);

  if (!snap) return null;

  const selectedNode = snap.graph.nodes.find((n) => n.id === selectedId) ?? null;
  const phoneNodes = snap.graph.nodes.filter((n) => n.kind === "phone");
  const multiSiteVehicles = vehicleRows.filter((r) => r.v.seenAt.length > 1).length;

  const setFocus = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("focus", id); else next.delete("focus");
    setParams(next, { replace: true });
  };
  const selectInGraph = (id: string) => {
    setSelectedId(id);
    document.getElementById("threat-graph")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const toggleKind = (k: GraphNodeKind) => setKinds((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suspect, Vehicle & MO Intelligence"
        subtitle="Cross-operator correlation of suspects, vehicles, identifiers, buyers and methods — correlations for lawful investigation, not findings"
        icon={Network}
      />

      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 flex items-start gap-2.5 text-[12px]">
        <Scale className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          <span className="text-foreground font-semibold">Lawful data-sharing & access control.</span> Links below are analytic correlations produced by ITIPS from incident records, CCTV/ANPR, seized exhibits and
          court-authorised data. Phone identifiers appear only where a legal basis is recorded. Every relationship shows its confidence and provenance and must be verified by an investigator before any action.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Potential cross-operator networks" value={networks.length} icon={GitBranch} tone="text-warning" hint="Same persons, different operators" />
        <KpiTile label="Persons of interest" value={suspectRows.length} icon={Users} hint={`${snap.suspects.filter((s) => s.status === "wanted").length} wanted`} />
        <KpiTile label="Vehicles at multiple sites" value={multiSiteVehicles} icon={Car} tone={multiSiteVehicles ? "text-warning" : "text-foreground"} hint={`${vehicleRows.length} vehicles of interest`} />
        <KpiTile label="Lawful phone identifiers" value={phoneNodes.length} icon={Fingerprint} hint="Each with recorded legal basis" />
      </div>

      <Panel title="Potentially same network" icon={AlertTriangle} actions={<span className="hud-chip">Correlation · requires lawful verification</span>}>
        {networks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No persons are currently linked to incidents at more than one operator.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {networks.map((n) => <NetworkCard key={n.id} n={n} vehicleLabel={(id) => snap.vehicles.find((v) => v.id === id)?.plate ?? snap.vehicles.find((v) => v.id === id)?.description ?? id} onPerson={selectInGraph} />)}
          </div>
        )}
      </Panel>

      <div id="threat-graph" className="grid grid-cols-12 gap-4 scroll-mt-4">
        <Panel
          title="Threat relationship graph"
          icon={Network}
          className="col-span-12 xl:col-span-8"
          actions={focusParam ? (
            <button onClick={() => setFocus(null)} className="hud-chip text-primary">Clear focus · {focusParam}</button>
          ) : <span className="text-[10px] text-muted-foreground font-mono">{graphNodes.length} nodes</span>}
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {ALL_KINDS.map((k) => {
              const on = kinds.has(k);
              return (
                <button key={k} onClick={() => toggleKind(k)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] transition-colors ${on ? "border-primary/40 text-foreground bg-primary/5" : "border-border/40 text-muted-foreground opacity-60"}`}>
                  <span className="h-2 w-2 rounded-full" style={{ background: GRAPH_KIND_COLOR[k] }} /> {KIND_LABEL[k]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-2 text-[11px]">
            <label className="flex items-center gap-2 text-muted-foreground">
              <span className="text-[9px] uppercase tracking-[0.14em]">Min confidence</span>
              <input type="range" min={0} max={0.95} step={0.05} value={minConf} onChange={(e) => setMinConf(Number(e.target.value))} className="w-32 accent-[hsl(var(--primary))]" />
              <span className="font-mono tabular-nums text-foreground w-9">{Math.round(minConf * 100)}%</span>
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <span className="text-[9px] uppercase tracking-[0.14em]">Focus depth</span>
              <select value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="bg-secondary/60 border border-primary/20 rounded px-1.5 py-0.5 text-foreground text-[11px]">
                <option value={1}>1 hop</option><option value={2}>2 hops</option><option value={3}>3 hops</option>
              </select>
            </label>
            <span className="text-muted-foreground">Select a node, then <span className="text-primary">Focus</span> to show its neighbourhood.</span>
          </div>
          {graphNodes.length ? (
            <RelationshipGraph nodes={graphNodes} edges={snap.graph.edges} height={540} selectedId={selectedId} minConfidence={minConf}
              onSelect={(n) => setSelectedId(n?.id ?? null)} />
          ) : <p className="text-xs text-muted-foreground py-16 text-center">No nodes match the current filters.</p>}
        </Panel>

        <Panel title={selectedNode ? "Selected entity" : "Entity detail"} icon={Layers} className="col-span-12 xl:col-span-4" bodyClassName="p-4 max-h-[680px] overflow-y-auto">
          {selectedNode ? (
            <NodeDetail node={selectedNode} snap={snap} edges={strongEdges} onSelect={setSelectedId}
              focused={focusParam === selectedNode.id} onToggleFocus={() => setFocus(focusParam === selectedNode.id ? null : selectedNode.id)} />
          ) : (
            <div className="text-xs text-muted-foreground space-y-2">
              <p>Click any node in the graph to see its details, linked ITIPS records and every relationship with its confidence and source.</p>
              <p>Edges below the minimum confidence are hidden; dashed edges are under 70% and should be treated as leads only.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Modus operandi × operator" icon={Layers} className="col-span-12 xl:col-span-7" actions={<span className="text-[10px] text-muted-foreground">{snap.incidents.length} incidents · 90 days</span>}>
          <ModusHeatmap incidents={snap.incidents} selected={mo} onSelect={setMo} />
        </Panel>
        <Panel title={mo ? "MO trend · selected method" : "MO trend · top 5 methods"} icon={GitBranch} className="col-span-12 xl:col-span-5" actions={<span className="hud-chip">Weekly</span>}>
          <ModusTrend incidents={snap.incidents} nowIso={snap.generatedAt} selected={mo} />
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Suspects & persons of interest" icon={Users} className="col-span-12 xl:col-span-7" bodyClassName="p-0">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-left">
                  <th className="px-3 py-2 font-normal">Person</th><th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 font-normal">Incidents</th><th className="px-3 py-2 font-normal">Operators</th><th className="px-3 py-2 font-normal">Last linked</th>
                </tr>
              </thead>
              <tbody>
                {suspectRows.map(({ s, incs, operators, inGraph }) => (
                  <tr key={s.id} className="border-t border-primary/10 hover:bg-primary/5 cursor-pointer"
                    onClick={() => (inGraph ? selectInGraph(s.id) : incs[0] && navigate(`/incident/${incs[0].id}`))}>
                    <td className="px-3 py-1.5">
                      <p className="text-foreground">{s.name ?? "Unidentified"} {s.alias !== "—" && <span className="text-muted-foreground">"{s.alias}"</span>} {s.armed && <Pill color="#ef4444">armed</Pill>}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.id}{inGraph && " · in graph"}</p>
                    </td>
                    <td className="px-3 py-1.5"><Pill color={SUSPECT_STATUS_COLOR[s.status] ?? "#94a3b8"}>{s.status}</Pill></td>
                    <td className="px-3 py-1.5 font-mono tabular-nums">{incs.length}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex flex-wrap gap-1">{operators.map((o) => <Pill key={o} color={OPERATOR_COLOR[o]}>{o}</Pill>)}</div>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{incs[0] ? fmtDate(incs[0].detectedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!suspectRows.length && <p className="text-xs text-muted-foreground p-4">No suspects recorded.</p>}
          </div>
        </Panel>

        <Panel title="Vehicles of interest" icon={Car} className="col-span-12 xl:col-span-5" bodyClassName="p-0" actions={<span className="text-[10px] text-muted-foreground">multi-site first</span>}>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-left">
                  <th className="px-3 py-2 font-normal">Vehicle</th><th className="px-3 py-2 font-normal">Sites</th><th className="px-3 py-2 font-normal">Operators</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRows.map(({ v, incs, operators, inGraph }) => (
                  <tr key={v.id} className={`border-t border-primary/10 hover:bg-primary/5 cursor-pointer ${v.seenAt.length > 1 ? "bg-warning/5" : ""}`}
                    onClick={() => (inGraph ? selectInGraph(v.id) : incs[0] && navigate(`/incident/${incs[0].id}`))}>
                    <td className="px-3 py-1.5">
                      <p className="font-mono text-foreground">{v.plate ?? "No plate"}</p>
                      <p className="text-[10px] text-muted-foreground">{v.description}</p>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`font-mono tabular-nums ${v.seenAt.length > 1 ? "text-warning font-semibold" : ""}`}>{v.seenAt.length}</span>
                      {v.seenAt.length > 1 && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-warning">multi-site</span>}
                    </td>
                    <td className="px-3 py-1.5"><div className="flex flex-wrap gap-1">{operators.map((o) => <Pill key={o} color={OPERATOR_COLOR[o]}>{o}</Pill>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!vehicleRows.length && <p className="text-xs text-muted-foreground p-4">No vehicles recorded.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function NetworkCard({ n, vehicleLabel, onPerson }: { n: NetworkCorrelation; vehicleLabel: (id: string) => string; onPerson: (id: string) => void }) {
  const caseIds = [...new Set(n.incidents.map((i) => i.caseId).filter((c): c is string => !!c))];
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill color="#f97316" solid>Potentially same network</Pill>
        <span className="text-[11px] text-muted-foreground">{n.incidents.length} incidents · {n.operators.length} operators</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">weakest link {Math.round(n.minConfidence * 100)}%</span>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[12px]">
        {n.incidents.map((i, k) => (
          <span key={i.id} className="flex items-center gap-1">
            {k > 0 && <ChevronRight className="h-3.5 w-3.5 text-warning" />}
            <Link to={`/incident/${i.id}`} className="rounded-md border px-2 py-1 hover:bg-primary/10 transition-colors" style={{ borderColor: `${OPERATOR_COLOR[i.operator]}66` }} title={`${i.id} · ${i.siteName}`}>
              <span className="font-semibold" style={{ color: OPERATOR_COLOR[i.operator] }}>{i.operator}</span>
              <span className="text-muted-foreground"> ({fmtDayShort(i.detectedAt)})</span>
            </Link>
          </span>
        ))}
      </div>

      <div className="text-[11px] space-y-1">
        <p className="text-muted-foreground">
          Persons:{" "}
          {n.persons.map((p, k) => (
            <span key={p.id}>{k > 0 && ", "}<button onClick={() => onPerson(p.id)} className="text-foreground hover:text-primary underline-offset-2 hover:underline">{p.label}</button></span>
          ))}
        </p>
        {n.vehicleIds.length > 0 && <p className="text-muted-foreground">Vehicles: <span className="text-foreground font-mono">{n.vehicleIds.map(vehicleLabel).join(", ")}</span></p>}
        <p className="text-muted-foreground">Sites: <span className="text-foreground">{n.incidents.map((i) => i.siteName).join(" · ")}</span></p>
        <p className="text-[10px] text-muted-foreground">Provenance: {n.sources.join("; ")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-warning/20">
        <span className="text-[10px] text-warning">Correlation only — each operator system sees these as unrelated incidents. Verify lawfully before action.</span>
        {caseIds.map((c) => <Link key={c} to={`/investigations/${c}`} className="hud-chip text-primary ml-auto">{c}</Link>)}
      </div>
    </div>
  );
}
