import {
  BrainCircuit, Car, Check, Clock, Crosshair, Eye, Footprints, Handshake, Megaphone, MoveRight, PauseCircle, Search, ShieldPlus, Undo2,
  type LucideIcon,
} from "lucide-react";
import { Meter, Pill } from "@/components/cnii/Pill";
import type { ThreatPrediction } from "@/lib/cnii";

export interface Decision {
  status: "approved" | "deferred";
  at: string; // ISO
  by: string;
}

const KIND_META: Record<ThreatPrediction["kind"], { label: string; color: string }> = {
  risk_increase: { label: "Risk increase", color: "#f97316" },
  reconnaissance: { label: "Reconnaissance pattern", color: "#a855f7" },
  cluster_expansion: { label: "Cluster expansion", color: "#ef4444" },
  coverage_gap: { label: "Coverage gap", color: "#06b6d4" },
};

/** Classify a free-text recommendation into an operational action type. */
function actionType(text: string): { label: string; icon: LucideIcon } {
  const t = text.toLowerCase();
  if (t.includes("reposition") || t.includes("pre-position")) return { label: "Reposition patrol", icon: MoveRight };
  if (t.includes("night patrol") || t.includes("patrol")) return { label: "Increase night patrol", icon: Footprints };
  if (t.includes("reinforce")) return { label: "Reinforce response unit", icon: ShieldPlus };
  if (t.includes("inspect")) return { label: "Inspect sites", icon: Search };
  if (t.includes("police")) return { label: "Coordinate with Police", icon: Handshake };
  if (t.includes("warn") || t.includes("operator")) return { label: "Warn operators", icon: Megaphone };
  if (t.includes("vehicle") || t.includes("monitor")) return { label: "Monitor vehicle", icon: Car };
  if (t.includes("investigation")) return { label: "Targeted investigation", icon: Eye };
  return { label: "Operational action", icon: Crosshair };
}

const watClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: false });

interface PredictionCardProps {
  prediction: ThreatPrediction;
  selected: boolean;
  decisions: Record<string, Decision | undefined>;
  onSelect: () => void;
  onDecide: (recIndex: number, status: Decision["status"] | null) => void;
}

export function PredictionCard({ prediction: p, selected, decisions, onSelect, onDecide }: PredictionCardProps) {
  const kind = KIND_META[p.kind];
  const conf = Math.round(p.confidence * 100);
  const decided = p.recommendations.filter((_, i) => decisions[`${p.id}#${i}`]).length;
  return (
    <article
      className={`rounded-lg border p-3 flex flex-col gap-2.5 transition-colors ${selected ? "border-primary/60 bg-primary/[0.07] shadow-[0_0_18px_hsl(var(--primary)/0.15)]" : "border-primary/15 bg-card/40 hover:border-primary/35"}`}
    >
      <button onClick={onSelect} className="text-left space-y-1.5" title="Focus the threat map on this prediction">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-primary">{p.id}</span>
          <Pill color={kind.color}>{kind.label}</Pill>
          {p.changePct != null && <Pill color="#ef4444">{p.changePct > 0 ? "+" : ""}{p.changePct}%</Pill>}
          <span className="ml-auto flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <Crosshair className="h-3 w-3" /> {selected ? "Focused" : "Focus map"}
          </span>
        </div>
        <h3 className="text-[13px] font-semibold leading-snug">{p.headline}</h3>
        <p className="text-[11px] text-muted-foreground">{p.region}</p>
      </button>

      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="flex items-center gap-1 text-muted-foreground"><BrainCircuit className="h-3 w-3" /> Model confidence</span>
          <span className="font-mono tabular-nums">{conf}%</span>
        </div>
        <Meter value={conf} color={conf >= 75 ? "#22c55e" : conf >= 60 ? "#eab308" : "#f97316"} />
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Basis · evidence indicators</p>
        <ul className="space-y-0.5">
          {p.basis.map((b) => (
            <li key={b} className="text-[11px] flex gap-1.5"><span className="text-primary/70">›</span><span>{b}</span></li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center mb-1">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Recommended actions · officer decision required</p>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{decided}/{p.recommendations.length}</span>
        </div>
        <ul className="space-y-1.5">
          {p.recommendations.map((r, i) => {
            const a = actionType(r);
            const d = decisions[`${p.id}#${i}`];
            return (
              <li key={r} className={`rounded-md border px-2 py-1.5 ${d?.status === "approved" ? "border-success/40 bg-success/5" : d?.status === "deferred" ? "border-warning/30 bg-warning/5" : "border-primary/10"}`}>
                <div className="flex items-start gap-2">
                  <a.icon className="h-3.5 w-3.5 mt-0.5 text-primary/80 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{a.label}</p>
                    <p className="text-[12px]">{r}</p>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 pl-5">
                  {d ? (
                    <>
                      <span className={`flex items-center gap-1 text-[10px] font-mono ${d.status === "approved" ? "text-success" : "text-warning"}`}>
                        {d.status === "approved" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {d.status === "approved" ? "Approved" : "Deferred"} by {d.by} {watClock(d.at)}
                      </span>
                      <button onClick={() => onDecide(i, null)} className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                        <Undo2 className="h-3 w-3" /> Undo
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onDecide(i, "approved")}
                        className="flex items-center gap-1 rounded border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success hover:bg-success/20">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => onDecide(i, "deferred")}
                        className="flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning hover:bg-warning/20">
                        <PauseCircle className="h-3 w-3" /> Defer
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-[9px] text-muted-foreground border-t border-primary/10 pt-1.5">
        AI risk-based recommendation from historical incident patterns. Not a determination of guilt or intent against any person, operator or contractor.
      </p>
    </article>
  );
}
