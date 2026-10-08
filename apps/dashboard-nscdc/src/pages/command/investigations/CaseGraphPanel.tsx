import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Network, Scale } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { RelationshipGraph } from "@/components/cnii/RelationshipGraph";
import { GRAPH_KIND_COLOR, type CniiSnapshot, type GraphNode, type InvestigationCase } from "@/lib/cnii";
import { caseGraph, nodeLink } from "./caseModel";

/** "An investigation graph rather than a folder of PDFs." */
export function CaseGraphPanel({ c, snap }: { c: InvestigationCase; snap: CniiSnapshot }) {
  const { nodes, edges, fromThreatGraph } = useMemo(() => caseGraph(c, snap), [c, snap]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [minConf, setMinConf] = useState(0);
  const sel = selected && nodes.some((n) => n.id === selected.id) ? selected : null;
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  const touching = sel ? edges.filter((e) => (e.from === sel.id || e.to === sel.id) && e.confidence >= minConf).sort((a, b) => b.confidence - a.confidence) : [];
  const link = sel ? nodeLink(sel) : null;

  return (
    <Panel
      title="Investigation graph"
      icon={Network}
      actions={
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="hidden sm:inline">{nodes.length} entities · {edges.length} links</span>
          <label className="flex items-center gap-1">
            Min confidence
            <select value={minConf} onChange={(e) => setMinConf(Number(e.target.value))} className="h-6 rounded border border-primary/20 bg-background/60 px-1 text-[10px] text-foreground">
              {[0, 0.6, 0.7, 0.8, 0.9].map((v) => <option key={v} value={v}>{Math.round(v * 100)}%</option>)}
            </select>
          </label>
        </div>
      }
      bodyClassName="p-3"
    >
      <p className="mb-2 text-[10px] text-muted-foreground">
        Person ↔ Phone ↔ Vehicle ↔ Contractor ↔ Site ↔ Incident ↔ Recovered asset ↔ Other cases.{" "}
        {fromThreatGraph ? "Drawn from the national threat graph (2 hops from this case's entities)." : "Built from this case's own records (no threat-graph presence yet)."}{" "}
        Links are <span className="text-foreground">correlations for investigation</span> — dashed lines are below 70% confidence.
      </p>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-8 min-w-0 rounded-md border border-primary/10 bg-background/30">
          {nodes.length ? (
            <RelationshipGraph nodes={nodes} edges={edges} height={420} selectedId={sel?.id ?? null} onSelect={setSelected} minConfidence={minConf} />
          ) : (
            <p className="p-10 text-center text-xs text-muted-foreground">No linked entities recorded for this case yet.</p>
          )}
        </div>
        <div className="col-span-12 lg:col-span-4 min-w-0">
          {sel ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ background: GRAPH_KIND_COLOR[sel.kind] }} />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{sel.kind}</p>
                  <p className="text-sm text-foreground break-words">{sel.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{sel.id}</p>
                </div>
              </div>
              {sel.meta && Object.keys(sel.meta).length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                  {Object.entries(sel.meta).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground capitalize flex items-center gap-1">{k === "basis" && <Scale className="h-3 w-3 text-primary" />}{k === "basis" ? "Legal basis" : k}</dt>
                      <dd className="text-foreground break-words">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {link && (
                <Link to={link} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Open record <ArrowUpRight className="h-3 w-3" /></Link>
              )}
              <p className="pt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Links · provenance · confidence</p>
              <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                {touching.map((e, i) => {
                  const other = e.from === sel.id ? e.to : e.from;
                  return (
                    <li key={i} className="rounded border border-primary/10 bg-background/40 px-2 py-1.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted-foreground">{e.from === sel.id ? "→" : "←"} {e.relation}</span>
                        <Pill color={e.confidence >= 0.85 ? "#22c55e" : e.confidence >= 0.7 ? "#eab308" : "#f97316"} className="ml-auto">{Math.round(e.confidence * 100)}%</Pill>
                      </div>
                      <button onClick={() => setSelected(nodes.find((n) => n.id === other) ?? null)} className="block text-left text-xs text-foreground hover:text-primary truncate max-w-full">{label(other)}</button>
                      <p className="text-[10px] text-muted-foreground">Source: {e.source}</p>
                    </li>
                  );
                })}
                {!touching.length && <li className="text-[11px] text-muted-foreground">No links above the confidence filter.</li>}
              </ul>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 p-4 text-xs text-muted-foreground">
              <Network className="h-6 w-6 text-primary/50" />
              Select an entity to see its links, the source of each link and its confidence.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
