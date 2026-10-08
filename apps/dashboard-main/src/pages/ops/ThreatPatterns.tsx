import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BrainCircuit, Building2, Car, Clock, Crosshair, Fingerprint, GitBranch, Layers, Map as MapIcon, Network, Route, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/ops/Panel";
import { Meter, Pill } from "@/components/ops/Pill";
import { RelationshipGraph } from "@/components/ops/RelationshipGraph";
import {
  ASSET_LABEL, INCIDENT_TYPE_COLOR, INCIDENT_TYPE_LABEL, fmtDate, useOps, type Campaign, type GraphNode, type PatternFinding,
} from "@/lib/ops";
import { CampaignMap } from "./threat/CampaignMap";
import { DnaPanel } from "./threat/DnaPanel";
import { Heatmap } from "./threat/Heatmap";
import { VehicleView } from "./threat/VehicleView";
import { OUTCOME_COLOR, OUTCOME_LABEL, buildCampaignGraph } from "./threat/campaignUtils";

const KIND_ICON: Record<PatternFinding["kind"], typeof Car> = { vehicle: Car, modus: Fingerprint, cluster: MapIcon, time: Clock, contractor: Building2 };
const TREND_ICON: Record<Campaign["trend"], typeof TrendingUp> = { expanding: TrendingUp, stable: Minus, dormant: TrendingDown };
const TREND_COLOR: Record<Campaign["trend"], string> = { expanding: "#ef4444", stable: "#eab308", dormant: "#64748b" };
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const words = (n: number) => WORDS[n] ?? String(n);

export default function ThreatPatterns() {
  const { snap } = useOps();
  const [params, setParams] = useSearchParams();
  const [heatScope, setHeatScope] = useState<"all" | "campaign">("all");
  const [graphSel, setGraphSel] = useState<GraphNode | null>(null);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const campaignId = params.get("campaign");
  const vehicle = params.get("vehicle");
  const campaign = snap?.campaigns.find((c) => c.id === campaignId) ?? snap?.campaigns[0];

  const campaignIncidents = useMemo(() => {
    if (!snap || !campaign) return [];
    const ids = new Set(campaign.incidentIds);
    return snap.incidents.filter((i) => ids.has(i.id)).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }, [snap, campaign]);
  const graph = useMemo(() => buildCampaignGraph(campaignIncidents, snap?.visits ?? []), [campaignIncidents, snap]);
  const siteMap = useMemo(() => new Map((snap?.sites ?? []).map((s) => [s.id, s])), [snap]);

  if (!snap) return null;

  const latest = campaignIncidents[0];
  const siteCount = campaign ? new Set(campaign.siteIds).size : 0;
  const TrendIcon = campaign ? TREND_ICON[campaign.trend] : Minus;
  const vehicleSubject = vehicle ? snap.insiderSubjects.find((s) => s.kind === "vehicle" && s.name.endsWith(vehicle)) : undefined;

  return (
    <>
      <PageHeader title="Threat Intelligence & Pattern Discovery" icon={BrainCircuit}
        subtitle="Connecting incidents across the estate — vehicles, methods, timing, geography and contractor ecosystems"
        actions={<span className="hud-chip">{snap.patterns.length} findings · {snap.campaigns.length} campaigns · {snap.incidents.length} incidents analysed</span>} />

      {vehicle && (
        <VehicleView plate={vehicle} incidents={snap.incidents} visits={snap.visits} sites={siteMap} subject={vehicleSubject} onClose={() => update({ vehicle: null })} />
      )}

      <div>
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Auto-identified findings · correlations for analyst review</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {snap.patterns.map((p) => {
            const Icon = KIND_ICON[p.kind];
            const camp = p.campaignId ? snap.campaigns.find((c) => c.id === p.campaignId) : null;
            const plate = p.kind === "vehicle" ? camp?.vehicles[0] : undefined;
            return (
              <div key={p.id} className={`glass-panel p-3 flex flex-col gap-2 ${p.campaignId && p.campaignId === campaign?.id ? "border-primary/50" : ""}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{p.kind}</span>
                  <span className="ml-auto font-mono text-[11px] font-bold text-primary">{Math.round(p.confidence * 100)}%</span>
                </div>
                <p className="text-[13px] font-semibold leading-snug text-foreground">{p.headline}</p>
                <Meter value={p.confidence * 100} />
                <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                  {p.evidence.map((e) => <li key={e}>• {e}</li>)}
                </ul>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {p.campaignId && <button onClick={() => update({ campaign: p.campaignId })} className="rounded border border-primary/40 px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/15">Campaign {p.campaignId}</button>}
                  {plate && <button onClick={() => update({ vehicle: plate })} className="rounded border border-primary/30 px-1.5 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/15">{plate}</button>}
                  {p.kind === "time" && <a href="#heatmap" className="rounded border border-primary/30 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/15">Heatmap ↓</a>}
                  {p.incidentIds.length > 0 && <span className="text-[10px] text-muted-foreground self-center">{p.incidentIds.length} incidents · {new Set(p.siteIds).size} sites</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {campaign && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mr-1">Campaign view</span>
            {snap.campaigns.map((c) => (
              <button key={c.id} onClick={() => { update({ campaign: c.id }); setGraphSel(null); }}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${c.id === campaign.id ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground hover:text-foreground"}`}>
                {c.id} <span className="font-normal">· {new Set(c.siteIds).size} sites · {c.trend}</span>
              </button>
            ))}
          </div>

          {latest && (
            <div className="glass-panel border-primary/40 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[12px] text-muted-foreground line-through decoration-muted-foreground/60">Site {latest.siteId} was attacked.</p>
                <p className="text-[15px] font-semibold text-foreground">
                  This attack appears related to <span className="text-primary">Campaign Cluster {campaign.id}</span> affecting {words(siteCount)} sites.
                </p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{campaign.summary}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill color={TREND_COLOR[campaign.trend]}><TrendIcon className="h-3 w-3" /> {campaign.trend}</Pill>
                {campaign.direction && <Pill color="#06b6d4"><Route className="h-3 w-3" /> {campaign.direction}</Pill>}
                <Pill color="#a855f7">Link confidence {Math.round(campaign.confidence * 100)}%</Pill>
                <span className="text-[10px] text-muted-foreground">Attribution is an analytical estimate, not proof — corroborate before enforcement action.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-4">
            <Panel title={`${campaign.id} — progression map`} icon={MapIcon} className="col-span-12 xl:col-span-7" bodyClassName="p-2">
              <CampaignMap incidents={campaignIncidents} direction={campaign.direction} />
            </Panel>

            <Panel title={campaign.name} icon={Crosshair} className="col-span-12 xl:col-span-5">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Fact label="First seen" value={fmtDate(campaign.firstSeen)} />
                <Fact label="Last seen" value={fmtDate(campaign.lastSeen)} />
                <Fact label="Sites / incidents" value={`${siteCount} / ${campaign.incidentIds.length}`} />
                <Fact label="Time band" value={campaign.timeBand} />
              </div>
              <div className="mt-3 space-y-2">
                <Chips label="Modus operandi" items={campaign.modus} />
                <Chips label="Target assets" items={campaign.targetAssets.map((a) => ASSET_LABEL[a])} />
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Vehicles</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.vehicles.length === 0 && <span className="text-[11px] text-muted-foreground">None identified</span>}
                    {campaign.vehicles.map((v) => (
                      <button key={v} onClick={() => update({ vehicle: v })} className="flex items-center gap-1 rounded border border-primary/30 px-1.5 py-0.5 font-mono text-[11px] text-primary hover:bg-primary/15">
                        <Car className="h-3 w-3" /> {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Timeline</p>
              <ol className="relative max-h-[210px] overflow-y-auto pr-1">
                {campaignIncidents.map((inc, i) => (
                  <li key={inc.id} className="relative flex gap-2 pb-2 pl-1">
                    {i < campaignIncidents.length - 1 && <span className="absolute left-[7px] top-4 bottom-0 w-px bg-primary/20" />}
                    <span className="relative z-10 mt-1 h-3 w-3 rounded-full border-2" style={{ borderColor: OUTCOME_COLOR[inc.outcome], background: `${OUTCOME_COLOR[inc.outcome]}44` }} />
                    <div className="min-w-0 text-[11px]">
                      <p className="flex flex-wrap gap-x-2">
                        <span className="font-mono text-muted-foreground">{fmtDate(inc.detectedAt)}</span>
                        <Link to={`/incidents/${inc.id}`} className="font-mono text-primary hover:underline">{inc.id}</Link>
                        <span style={{ color: INCIDENT_TYPE_COLOR[inc.type] }}>{INCIDENT_TYPE_LABEL[inc.type]}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        <Link to={`/sites/${inc.siteId}`} className="hover:text-primary">{inc.siteId} · {inc.siteName}</Link> · {inc.modus.join(", ")} · <span style={{ color: OUTCOME_COLOR[inc.outcome] }}>{OUTCOME_LABEL[inc.outcome]}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Relationship graph — incidents · sites · vehicles · contractors" icon={Network} className="col-span-12 xl:col-span-7"
              actions={<span className="hud-chip">{graph.nodes.length} entities · {graph.edges.length} links</span>}>
              {graph.nodes.length === 0 ? <p className="text-xs text-muted-foreground">No entities.</p> : (
                <RelationshipGraph nodes={graph.nodes} edges={graph.edges} height={460} selectedId={graphSel?.id} onSelect={setGraphSel} />
              )}
              {graphSel && <GraphSelection node={graphSel} onVehicle={(p) => update({ vehicle: p })} />}
            </Panel>

            <DnaPanel key={campaign.id} incidents={campaignIncidents} visits={snap.visits} className="col-span-12 xl:col-span-5" />
          </div>
        </>
      )}

      <div id="heatmap" className="grid grid-cols-12 gap-4">
        <Panel title="When attacks happen — hour of day × weekday (WAT)" icon={Layers} className="col-span-12"
          actions={(
            <div className="flex gap-1">
              {(["all", "campaign"] as const).map((s) => (
                <button key={s} onClick={() => setHeatScope(s)} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${heatScope === s ? "border-primary bg-primary/20 text-primary" : "border-primary/20 text-muted-foreground"}`}>
                  {s === "all" ? `All incidents (${snap.incidents.length})` : `Campaign ${campaign?.id ?? ""}`}
                </button>
              ))}
            </div>
          )}>
          <Heatmap incidents={heatScope === "all" ? snap.incidents : campaignIncidents} />
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><GitBranch className="h-3 w-3" /> Column bars show the hourly total; use it to time patrols and AI sensitivity profiles.</p>
        </Panel>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-secondary/30 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-mono text-foreground">{value}</p>
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">{items.map((m) => <span key={m} className="hud-chip">{m}</span>)}</div>
    </div>
  );
}

function GraphSelection({ node, onVehicle }: { node: GraphNode; onVehicle: (plate: string) => void }) {
  const id = node.id.slice(node.id.indexOf(":") + 1);
  const action = node.kind === "incident" ? <Link to={`/incidents/${id}`} className="text-primary hover:underline">Open incident →</Link>
    : node.kind === "site" ? <Link to={`/sites/${id}`} className="text-primary hover:underline">Open site twin →</Link>
      : node.kind === "vehicle" ? <button onClick={() => onVehicle(id)} className="text-primary hover:underline">Vehicle history →</button>
        : <Link to={`/access?q=${encodeURIComponent(id)}`} className="text-primary hover:underline">Access records →</Link>;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px]">
      <span className="uppercase text-[9px] tracking-[0.14em] text-muted-foreground">{node.kind}</span>
      <span className="font-semibold text-foreground">{node.label}</span>
      <span className="ml-auto">{action}</span>
    </div>
  );
}
