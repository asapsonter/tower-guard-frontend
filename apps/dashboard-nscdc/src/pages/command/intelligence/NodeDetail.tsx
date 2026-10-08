import { Link } from "react-router-dom";
import { ArrowRight, Crosshair, Scale } from "lucide-react";
import type { CniiSnapshot, GraphEdge, GraphNode } from "@/lib/cnii";
import { GRAPH_KIND_COLOR, INCIDENT_STATUS_LABEL, fmtDate, fmtNaira } from "@/lib/cnii";
import { Pill, Meter } from "@/components/cnii/Pill";
import { nodeLink } from "./analysis";

interface Props {
  node: GraphNode;
  snap: CniiSnapshot;
  edges: GraphEdge[];
  onSelect: (id: string) => void;
  focused: boolean;
  onToggleFocus: () => void;
}

const confColor = (c: number) => (c >= 0.85 ? "#22c55e" : c >= 0.7 ? "#eab308" : "#f97316");

/** Side panel for the selected graph node: details, linked records and every edge with provenance. */
export function NodeDetail({ node, snap, edges, onSelect, focused, onToggleFocus }: Props) {
  const c = GRAPH_KIND_COLOR[node.kind];
  const nodeById = new Map(snap.graph.nodes.map((n) => [n.id, n]));
  const mine = edges.filter((e) => e.from === node.id || e.to === node.id).sort((a, b) => b.confidence - a.confidence);
  const suspect = snap.suspects.find((s) => s.id === node.id);
  const vehicle = snap.vehicles.find((v) => v.id === node.id);
  const incident = snap.incidents.find((i) => i.id === node.id);
  const asset = snap.stolenAssets.find((a) => a.id === node.id);
  const kase = snap.cases.find((k) => k.id === node.id);
  const prosecution = kase ? snap.prosecutions.find((p) => p.caseId === kase.id) : undefined;
  const link = nodeLink(node);
  const { basis, ...meta } = node.meta ?? {};

  return (
    <div className="space-y-3 text-[12px]">
      <div className="flex items-start gap-2">
        <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground leading-tight">{node.label}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{node.id} · <span className="capitalize">{node.kind}</span></p>
        </div>
        <button onClick={onToggleFocus} className={`hud-chip flex items-center gap-1 ${focused ? "text-primary border-primary/60" : ""}`} title="Show only this node's neighbourhood">
          <Crosshair className="h-3 w-3" /> {focused ? "Focused" : "Focus"}
        </button>
      </div>

      {basis != null && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-2.5 py-2 flex gap-2">
          <Scale className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-warning">Lawful basis for this identifier</p>
            <p className="text-foreground">{String(basis)}</p>
          </div>
        </div>
      )}

      {Object.keys(meta).length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          {Object.entries(meta).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
              <dd className="font-mono text-foreground truncate">{k === "value" && typeof v === "number" ? fmtNaira(v) : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Linked records</p>
        {suspect && (
          <div className="rounded-md bg-secondary/40 px-2.5 py-2">
            <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{suspect.id}</span><Pill color="#ef4444">{suspect.status}</Pill>{suspect.armed && <Pill color="#ef4444" solid>armed</Pill>}</div>
            <p className="text-muted-foreground mt-1">{suspect.description}</p>
          </div>
        )}
        {vehicle && (
          <div className="rounded-md bg-secondary/40 px-2.5 py-2">
            <p className="font-mono text-foreground">{vehicle.plate ?? "No plate"}</p>
            <p className="text-muted-foreground">{vehicle.description} · seen at {vehicle.seenAt.length} site(s)</p>
          </div>
        )}
        {incident && (
          <div className="rounded-md bg-secondary/40 px-2.5 py-2">
            <p className="text-foreground">{incident.title}</p>
            <p className="text-muted-foreground">{incident.operator} · {incident.siteName} · {fmtDate(incident.detectedAt)} · {INCIDENT_STATUS_LABEL[incident.status]}</p>
          </div>
        )}
        {asset && (
          <div className="rounded-md bg-secondary/40 px-2.5 py-2">
            <p className="text-foreground capitalize">{asset.equipmentType.replace("_", " ")} · {asset.manufacturer} · {fmtNaira(asset.valueNaira)}</p>
            <p className="text-muted-foreground">From {asset.siteName} ({asset.operator}) · {asset.recoveryStatus}{asset.recoveryLocation ? ` at ${asset.recoveryLocation.name}` : ""}</p>
          </div>
        )}
        {kase && (
          <div className="rounded-md bg-secondary/40 px-2.5 py-2">
            <p className="text-foreground">{kase.title}</p>
            <p className="text-muted-foreground">Lead: {kase.leadInvestigator} · {kase.status}{prosecution ? ` · prosecution ${prosecution.stage}` : ""}</p>
          </div>
        )}
        {link && (
          <Link to={link} className="inline-flex items-center gap-1 text-primary hover:underline">
            Open record <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        {!suspect && !vehicle && !incident && !asset && !kase && !link && <p className="text-muted-foreground">No linked ITIPS record beyond the graph.</p>}
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Relationships ({mine.length}) · confidence & provenance</p>
        {mine.length === 0 && <p className="text-muted-foreground">No relationships above the confidence threshold.</p>}
        {mine.map((e, i) => {
          const otherId = e.from === node.id ? e.to : e.from;
          const other = nodeById.get(otherId);
          const outgoing = e.from === node.id;
          return (
            <button key={i} onClick={() => onSelect(otherId)} className="w-full text-left rounded-md border border-primary/10 hover:border-primary/40 px-2.5 py-1.5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{outgoing ? "→" : "←"} {e.relation}</span>
                <span className="ml-auto font-mono tabular-nums" style={{ color: confColor(e.confidence) }}>{Math.round(e.confidence * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {other && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: GRAPH_KIND_COLOR[other.kind] }} />}
                <span className="text-foreground truncate">{other?.label ?? otherId}</span>
              </div>
              <Meter value={e.confidence * 100} color={confColor(e.confidence)} className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Source: {e.source}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
