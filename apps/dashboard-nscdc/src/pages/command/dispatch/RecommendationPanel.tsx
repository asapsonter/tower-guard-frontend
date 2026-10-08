import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle2, Cpu, Loader2, ShieldCheck, Shuffle } from "lucide-react";
import { Panel } from "@/components/cnii/Panel";
import { Pill } from "@/components/cnii/Pill";
import { SlaCountdown } from "@/components/cnii/SlaCountdown";
import {
  INCIDENT_STATUS_LABEL, INCIDENT_TYPE_LABEL, SEVERITY_COLOR, fmtDuration, type DispatchRecommendation, type Incident, type ResponseUnit,
} from "@/lib/cnii";
import { AWAITING_DISPATCH, placeName } from "../incident/roomUtils";
import { ApproveDialog, type ApproveMode } from "./ApproveDialog";

export interface RecState {
  loading: boolean;
  rec: DispatchRecommendation | null;
  error: string | null;
}

interface RecommendationPanelProps {
  incident?: Incident;
  state: RecState;
  respondingUnit?: ResponseUnit;
  approval: { unitId: string; by: string } | null;
  onApproved: (unitId: string, by: string) => void;
}

function Stat({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`font-mono text-[15px] font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** ITIPS smart-dispatch recommendation with the human approval controls. */
export function RecommendationPanel({ incident, state, respondingUnit, approval, onApproved }: RecommendationPanelProps) {
  const [dialog, setDialog] = useState<{ mode: ApproveMode; unitId?: string } | null>(null);

  if (!incident) {
    return (
      <Panel title="Smart dispatch" icon={Cpu}>
        <p className="text-xs text-muted-foreground">Select an incident from the dispatch queue to request an ITIPS recommendation.</p>
      </Panel>
    );
  }

  const { rec, loading, error } = state;
  const awaiting = AWAITING_DISPATCH(incident);

  return (
    <Panel title="Smart dispatch" icon={Cpu}
      actions={<span className="hud-chip"><Bot className="h-3 w-3" /> AI recommends · officers command</span>}>
      <div className="flex flex-wrap items-start gap-3 pb-3 border-b border-primary/10">
        <div className="min-w-0 flex-1">
          <Link to={`/incident/${incident.id}`} className="font-mono text-[12px] text-primary hover:underline">{incident.id}</Link>
          <p className="text-[13px] font-semibold text-foreground">{INCIDENT_TYPE_LABEL[incident.type]} · {placeName(incident)}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill color={SEVERITY_COLOR[incident.severity]} className="uppercase">{incident.threatLevel}</Pill>
            <Pill color={awaiting ? "#f59e0b" : "#22c55e"}>{INCIDENT_STATUS_LABEL[incident.status]}</Pill>
            <span className="hud-chip">{incident.operator}</span>
          </div>
        </div>
        <SlaCountdown alertAt={incident.response.stages.alert ?? incident.detectedAt} slaSeconds={incident.response.slaSeconds} arrivalAt={incident.response.verifiedArrival} />
      </div>

      {approval && (
        <div className="mt-3 rounded-md border border-success/40 bg-success/10 p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <p className="font-semibold text-foreground">Dispatch approved — NSCDC Team {approval.unitId} assigned</p>
            <p className="text-muted-foreground">Approved by {approval.by}. Recorded in the incident timeline and SLA audit.</p>
            <Link to={`/incident/${incident.id}`} className="text-primary hover:underline">Open incident room →</Link>
          </div>
        </div>
      )}

      {!awaiting && !approval && (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Already dispatched{respondingUnit ? <> to <span className="font-mono text-foreground">{respondingUnit.callsign}</span></> : ""}. No recommendation required.
        </p>
      )}

      {awaiting && (
        <div className="mt-3">
          {loading ? (
            <p className="flex items-center gap-2 text-[12px] text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> ITIPS evaluating response units…</p>
          ) : error ? (
            <p className="text-[12px] text-destructive">{error}</p>
          ) : !rec ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-[12px] text-warning">
              No compliant response team within range (available/standby, comms up, equipment ≥ 70%, armed where a weapon is suspected). Escalate to State Command for mutual aid.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary font-semibold">ITIPS recommends</p>
                <p className="mt-0.5 text-[13px] text-foreground">Closest compliant response team: <span className="font-mono font-bold text-primary">{rec.callsign}</span></p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Distance" value={`${rec.distanceKm} km`} />
                  <Stat label="ETA" value={fmtDuration(rec.etaSeconds)} tone="text-primary" />
                  <div className="col-span-2 min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Threat</p>
                    <p className={`text-[13px] font-semibold ${incident.weaponSuspected ? "text-destructive" : "text-foreground"}`}>{rec.threat}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Recommended support</p>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">{rec.recommendedSupport.map((s) => <span key={s} className="hud-chip">{s}</span>)}</div>
                </div>
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground list-disc pl-4">
                  {rec.rationale.map((r) => <li key={r}>{r}</li>)}
                </ul>
                <p className="mt-2 text-[10px] text-muted-foreground/80">
                  Provenance: ITIPS dispatch engine · rule-based (deterministic) · compliance = available/standby, comms not offline, equipment ≥ 70%, armed for weapon threats, ≤ 60 km.
                </p>
              </div>

              {!approval && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setDialog({ mode: "recommended" })}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground hover:bg-primary/90">
                    <ShieldCheck className="h-4 w-4" /> Approve dispatch
                  </button>
                  {rec.alternatives.length > 0 && (
                    <button onClick={() => setDialog({ mode: "override" })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-2 text-[12px] text-foreground hover:bg-secondary/50">
                      <Shuffle className="h-3.5 w-3.5" /> Override with alternative
                    </button>
                  )}
                </div>
              )}

              {rec.alternatives.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Alternatives considered</p>
                  <table className="w-full min-w-[420px] text-[11px]">
                    <thead>
                      <tr className="text-left text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        <th className="py-1 pr-2">Unit</th><th className="pr-2 text-right">Dist.</th><th className="pr-2 text-right">ETA</th><th className="pr-2">Why not top</th><th />
                      </tr>
                    </thead>
                    <tbody>
                      {rec.alternatives.map((a) => (
                        <tr key={a.unitId} className="border-t border-primary/10">
                          <td className="py-1 pr-2 font-mono font-semibold">{a.callsign}</td>
                          <td className="pr-2 text-right font-mono">{a.distanceKm} km</td>
                          <td className="pr-2 text-right font-mono">{fmtDuration(a.etaSeconds)}</td>
                          <td className="pr-2 text-muted-foreground">{a.reasonNotTop}</td>
                          <td className="text-right">
                            {!approval && (
                              <button onClick={() => setDialog({ mode: "override", unitId: a.unitId })} className="text-[10px] text-primary hover:underline whitespace-nowrap">Use instead</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <ApproveDialog open={!!dialog} mode={dialog?.mode ?? "recommended"} initialUnitId={dialog?.unitId}
                incident={incident} rec={rec} onOpenChange={(o) => !o && setDialog(null)} onApproved={onApproved} />
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
